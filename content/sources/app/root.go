// Package cli wires the safe-install commands.
package cli

import (
	"errors"
	"fmt"
	"io"
	"os"
	"runtime"
	"strings"

	"github.com/spf13/cobra"

	"github.com/crossben/safe-install/internal/monitor"
	"github.com/crossben/safe-install/internal/policy"
	"github.com/crossben/safe-install/internal/sandbox"
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
	pm         string
	yes        bool
	ci         bool
	format     string
	offline    bool
	registry   string
	minAge     string
	monitor    string // "", "report" or "kill" (install, add, approve)
	frozen     bool   // install exactly the lockfile (install --frozen-lockfile, ci)
	sandbox    bool   // run approved scripts under Landlock (install, add, approve)
	sandboxNet bool   // ...with the network left open
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
	pf.StringVar(&g.format, "format", "text", "output format: text, json, sarif (check also: markdown)")
	pf.BoolVar(&g.offline, "offline", false, "use cached registry data only")
	pf.StringVar(&g.registry, "registry", "", "registry URL (default https://registry.npmjs.org)")
	pf.StringVar(&g.minAge, "min-age", "72h", "minimum release age, e.g. 72h or 3d; 0 disables")

	root.AddCommand(newInstallCmd(&g), newAddCmd(&g), newCheckCmd(&g), newScriptsCmd(&g),
		newApproveCmd(&g), newWhyCmd(&g), newScanCmd(&g), newCacheCmd(), newExplainCmd(), newShellInitCmd(), newVersionCmd(), newLLMCmd())
	root.Version = version
	root.SetVersionTemplate(versionLine() + "\n")
	root.Flags().BoolP("version", "v", false, "print version information")
	return root
}

// addMonitorFlag adds --monitor and --sandbox to a command that runs install scripts.
func addMonitorFlag(cmd *cobra.Command, g *globalFlags) {
	cmd.Flags().StringVar(&g.monitor, "monitor", "", "watch approved scripts as they run (Linux): report, or kill on the first high-risk action")
	cmd.Flags().Lookup("monitor").NoOptDefVal = string(monitor.ModeReport)
	cmd.Flags().BoolVar(&g.sandbox, "sandbox", false, "run approved scripts in a Landlock sandbox (Linux): no home folder, no network, writes only to the package, node_modules, temp and caches")
	cmd.Flags().BoolVar(&g.sandboxNet, "sandbox-net", false, "with --sandbox, leave the network open (for scripts that download binaries)")
}

// sandboxCheck validates --sandbox before anything is installed.
func sandboxCheck(g *globalFlags) error {
	if g.sandboxNet && !g.sandbox {
		return errors.New("--sandbox-net only makes sense with --sandbox")
	}
	if !g.sandbox {
		return nil
	}
	if runtime.GOOS != "linux" {
		return fmt.Errorf("the sandbox is Linux-only. Want this too? Too bad, you're on %s. Everything else in safe-install works the same here", osName())
	}
	return sandbox.Check(g.sandboxNet)
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
	if pol.OrgWarning != "" {
		_, _ = fmt.Fprintln(cmd.ErrOrStderr(), "safe-install:", pol.OrgWarning)
	}
	if !cmd.Flags().Changed("min-age") && pol.MinReleaseAge != "" {
		g.minAge = pol.MinReleaseAge
	}
	return pol, nil
}

// Execute runs the CLI and returns the process exit code.
func Execute() int {
	return run(os.Args[1:], os.Stdin, os.Stdout, os.Stderr)
}

// run dispatches one invocation: safe-install's own commands go to cobra;
// install verbs are routed to safe-install's install/add; verbs that would
// run install scripts or download and execute code are refused; anything
// else is passed to the project's package manager unchanged.
func run(args []string, in io.Reader, out, errOut io.Writer) int {
	root := newRootCmd()
	root.SetIn(in)
	root.SetOut(out)
	root.SetErr(errOut)
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") && !isCommand(root, args[0]) {
		cwd, _ := os.Getwd()
		switch classify(args, projectScripts(cwd)) {
		case verbInstall:
			args = installArgsFor(args[1:])
		case verbCleanInstall:
			args = append([]string{"install", "--frozen-lockfile", "--"}, args[1:]...)
		case verbRefused:
			_, _ = fmt.Fprintln(errOut, "safe-install:", refusal(args))
			return ExitPolicyFailure
		case verbPassthrough:
			return passthrough(args, false, in, out, errOut)
		case verbScriptsOff:
			return passthrough(args, true, in, out, errOut)
		}
	}
	root.SetArgs(args)
	notice := checkForUpdate(args, errOut)
	err := root.Execute()
	pruneCache() // also after a failed command: the cache may have grown
	notice()
	if err != nil {
		_, _ = fmt.Fprintln(errOut, "safe-install:", err)
		var ee *exitError
		if errors.As(err, &ee) {
			return ee.code
		}
		return ExitToolError
	}
	return ExitOK
}

func isCommand(root *cobra.Command, name string) bool {
	if name == "help" || name == "completion" || name == "__complete" {
		return true
	}
	for _, c := range root.Commands() {
		if c.Name() == name || c.HasAlias(name) {
			return true
		}
	}
	return false
}
