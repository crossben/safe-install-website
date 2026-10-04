// Package cli wires the safe-install commands.
package cli

import (
	"errors"
	"fmt"
	"os"
	"runtime"

	"github.com/spf13/cobra"

	"github.com/crossben/safe-install/internal/monitor"
	"github.com/crossben/safe-install/internal/policy"
)

// Exit codes (plan §8).
const (
	ExitOK            = 0
	ExitPolicyFailure = 1
	ExitAborted       = 2
	ExitToolError     = 3
)

// Global flags shared by every command.
type globalFlags struct {
	pm       string
	yes      bool
	ci       bool
	format   string
	offline  bool
	registry string
	minAge   string
	monitor  string // "", "report" or "kill" (install, add, approve)
}

// exitError carries a specific exit code up to Execute.
type exitError struct {
	code int
	err  error
}

func (e *exitError) Error() string { return e.err.Error() }
func (e *exitError) Unwrap() error { return e.err }

func newRootCmd() *cobra.Command {
	var g globalFlags

	root := &cobra.Command{
		Use:           "safe-install",
		Short:         "Install dependencies. Not malware.",
		Long:          "safe-install analyzes your dependency tree, installs with lifecycle scripts\ndisabled, and runs only the scripts you approved.",
		SilenceUsage:  true,
		SilenceErrors: true,
		Args:          installArgs,
		RunE: func(cmd *cobra.Command, args []string) error {
			return runInstall(cmd, &g, args, false)
		},
	}

	pf := root.PersistentFlags()
	pf.StringVar(&g.pm, "pm", "", "package manager to use (npm, pnpm, yarn, bun); detected when empty")
	pf.BoolVarP(&g.yes, "yes", "y", false, "answer yes to prompts")
	pf.BoolVar(&g.ci, "ci", false, "non-interactive mode; fail on policy violations")
	pf.StringVar(&g.format, "format", "text", "output format: text, json, sarif")
	pf.BoolVar(&g.offline, "offline", false, "use cached registry data only")
	pf.StringVar(&g.registry, "registry", "", "registry URL (default https://registry.npmjs.org)")
	pf.StringVar(&g.minAge, "min-age", "72h", "minimum release age, e.g. 72h or 3d; 0 disables")

	root.AddCommand(newInstallCmd(&g), newAddCmd(&g), newCheckCmd(&g), newScriptsCmd(&g),
		newApproveCmd(&g), newExplainCmd(), newShellInitCmd(), newVersionCmd())
	return root
}

// addMonitorFlag adds --monitor to a command that runs install scripts.
func addMonitorFlag(cmd *cobra.Command, g *globalFlags) {
	cmd.Flags().StringVar(&g.monitor, "monitor", "", "watch approved scripts as they run (Linux): report, or kill on the first high-risk action")
	cmd.Flags().Lookup("monitor").NoOptDefVal = string(monitor.ModeReport)
}

// monitorMode validates --monitor; the error explains the Linux-only part.
func monitorMode(g *globalFlags) (monitor.Mode, error) {
	switch mode := monitor.Mode(g.monitor); mode {
	case "":
		return "", nil
	case monitor.ModeReport, monitor.ModeKill:
		if err := monitor.Supported(); err != nil {
			if errors.Is(err, monitor.ErrUnsupportedOS) {
				return "", fmt.Errorf("%w. Want this too? Too bad, you're on %s. Everything else in safe-install works the same here", err, osName())
			}
			return "", err
		}
		return mode, nil
	default:
		return "", fmt.Errorf("unknown --monitor %q (report, kill)", g.monitor)
	}
}

func osName() string {
	switch runtime.GOOS {
	case "darwin":
		return "macOS"
	case "windows":
		return "Windows"
	}
	return runtime.GOOS
}

// loadPolicy reads the policy for the current directory and applies it
// where the user did not pass the matching flag.
func loadPolicy(cmd *cobra.Command, g *globalFlags) (*policy.Policy, error) {
	dir, err := os.Getwd()
	if err != nil {
		return nil, err
	}
	pol, err := policy.Load(dir)
	if err != nil {
		return nil, err
	}
	if !cmd.Flags().Changed("min-age") && pol.MinReleaseAge != "" {
		g.minAge = pol.MinReleaseAge
	}
	return pol, nil
}

// Execute runs the CLI and returns the process exit code.
func Execute() int {
	if err := newRootCmd().Execute(); err != nil {
		fmt.Fprintln(os.Stderr, "safe-install:", err)
		var ee *exitError
		if errors.As(err, &ee) {
			return ee.code
		}
		return ExitToolError
	}
	return ExitOK
}
