# safe-install — Plan

> A cross-platform CLI that stops malicious install scripts before they run.
> Go · Apache-2.0 · Linux / macOS / Windows

## 1. Why

Supply-chain attacks on npm nearly always use the same door: **lifecycle scripts**
(`preinstall`, `install`, `postinstall`). A compromised or typosquatted package runs
arbitrary code the moment `npm install` executes. They hit any dependency in the tree,
not just the ones you list.

`safe-install` closes that door by default and opens it only for scripts you approved.

### Success criteria

- Drop-in: `safe-install` in place of `npm install` / `pnpm install` / `yarn` / `bun install`.
- Covers the **whole dependency tree** from the lockfile, not just `package.json`.
- Identical behavior on Linux, macOS and Windows (single static binary, no runtime).
- Low noise: popular, long-lived packages with known-good scripts don't nag.
- Explainable: every warning says *why* (rule + evidence).
- CI-friendly: non-interactive mode with exit codes and JSON / SARIF output.
- Linux bonus: optional runtime monitoring of approved scripts.

### Non-goals (v1)

- Malware detection by content scanning of whole packages (we inspect *scripts*, plus heuristics).
- Ecosystems other than JavaScript (pip, cargo… later, behind the same interfaces).
- Runtime monitoring on macOS / Windows.

## 2. Core idea: control, then observe

```
1. Analyze   lockfile → full tree → registry metadata → risk score per package
2. Install   package manager with ALL lifecycle scripts disabled
3. Inspect   list every package that wants to run a script; show + flag the script
4. Approve   user (or policy file) approves per package@version
5. Run       execute approved scripts only   [Linux: optionally under the runtime monitor]
```

Downloading and extracting tarballs is safe; executing scripts is not. Separating
the two is what makes this work everywhere without OS-specific tricks.

## 3. Stack

| Concern | Choice | Why |
|---|---|---|
| Language | **Go 1.25+** | Static single binary per OS/arch, trivial cross-compile, fast concurrent HTTP, mature security-tooling ecosystem (osv-scanner, trivy, grype are Go). |
| CLI | `spf13/cobra` | De-facto standard, completions, subcommands. |
| Config | `encoding/json` + optional YAML (`goccy/go-yaml`) | Policy files must be readable and diff-friendly. |
| Lockfile parsing | own parsers (`encoding/json`, `goccy/go-yaml`) | Each format is small; avoids heavy deps (a security tool should have few). |
| HTTP | `net/http` + on-disk cache (`os.UserCacheDir`) | Registry metadata cache with ETag revalidation. |
| Terminal UI | `charmbracelet/lipgloss` + `charmbracelet/huh` (prompts) | Clean, colors degrade gracefully on Windows/CI. |
| Script analysis | Go regex + small token scanner | No JS engine needed for v1 heuristics. |
| Linux monitor | `cilium/ebpf` (preferred) with `strace` fallback, `fsnotify` | Runtime visibility on Linux only. |
| Testing | `testing` + golden files, `testscript` (rogpeppe/go-internal) for CLI e2e | Fixtures of real lockfiles and malicious-script corpora. |
| Release | **GoReleaser** + GitHub Actions | Builds linux/darwin/windows × amd64/arm64; publishes GitHub Releases, Homebrew tap, Scoop bucket, `.deb`/`.rpm`, checksums, **cosign signatures + SLSA provenance**. |
| Lint | `golangci-lint`, `govulncheck` | We must be a clean dependency ourselves. |

We deliberately **do not** distribute primarily via npm: a supply-chain security tool
installed through the channel it protects is a weak story. (An npm shim package that downloads
the signed binary can come later, with checksum verification.)

## 4. Package managers supported in v1

| PM | Lockfile | Disable scripts | Run approved scripts |
|---|---|---|---|
| npm | `package-lock.json` (v2/v3) | `npm install --ignore-scripts` | `npm rebuild <pkg>` per approved package |
| pnpm | `pnpm-lock.yaml` (v6–v9) | `pnpm install --ignore-scripts` | `pnpm rebuild <pkg>` |
| Yarn classic | `yarn.lock` (v1) | `yarn install --ignore-scripts` | run scripts from package dir (lifecycle order) |
| Yarn berry | `yarn.lock` (YAML, v2+) | `YARN_ENABLE_SCRIPTS=false` | write `dependenciesMeta.<pkg>.built` / `yarn rebuild <pkg>` |
| bun | `bun.lock` (text, ≥1.2) | `bun install --ignore-scripts` | `bun pm trust <pkg>` |

Detection: by lockfile presence, then `packageManager` field in `package.json`,
then `--pm` flag. Each PM is an **adapter** behind one interface (see §5); exact flag
behavior per PM version is verified by integration tests in CI, not assumed.

## 5. Architecture

Repo layout: the Go CLI lives in `app/` and the website in `website/`. Each is its own
public git repo; the root (plan, prompts) is not committed. Module path:
`github.com/crossben/safe-install`. Work stops at the end of each milestone for review.

```
app/cmd/safe-install/          main + cobra commands
internal/
  lockfile/                Parser interface → Graph{Packages, Edges}
    npm/ pnpm/ yarnv1/ yarnberry/ bun/
  pm/                      Adapter interface: Detect, InstallNoScripts, RunScripts(pkgs)
    npm/ pnpm/ yarn/ bun/
  registry/                npm registry client + cache (packument, abbreviated + full)
  analyze/                 Rule interface → []Finding; risk engine aggregates score
    rules/                 one file per rule
  scripts/                 extract + statically flag lifecycle scripts
  policy/                  trust store, project policy file, global config
  report/                  terminal, JSON, SARIF renderers
  monitor/                 (linux build tag) eBPF/strace runner + event rules
                           (other OS: stub returning ErrUnsupported + friendly message)
```

Key interfaces:

```go
type LockfileParser interface {
    Detect(dir string) bool
    Parse(dir string) (*Graph, error)   // every resolved name@version, with integrity
}

type Adapter interface {
    Name() string
    InstallNoScripts(ctx context.Context, dir string, args []string) error
    RunScripts(ctx context.Context, dir string, pkgs []PackageRef) error
}

type Rule interface {
    ID() string                                     // e.g. "SI-REC-001"
    Check(ctx context.Context, p *PackageInfo) []Finding
}
```

## 6. Risk rules (v1)

Each rule has an ID, severity, weight, and an evidence string. Score = weighted sum,
capped at 100; levels: `low <30`, `medium 30–59`, `high ≥60`, plus some rules are
**always-block** regardless of score.

| ID | Signal | Severity |
|---|---|---|
| SI-SCR-001 | Has `preinstall` / `install` / `postinstall` | medium |
| SI-SCR-002 | Script downloads + executes (`curl … \| sh`, `wget`, `Invoke-WebRequest`, `powershell -enc`) | high / block |
| SI-SCR-003 | Script uses `eval`, `new Function`, `child_process` with dynamic strings, base64 / hex blobs | high |
| SI-SCR-004 | Script references secrets paths (`~/.ssh`, `~/.npmrc`, `.env`, `~/.aws`, browser profiles) | high |
| SI-SCR-005 | Script changed vs. the previously approved version | high (re-approval) |
| SI-REC-001 | Version published more recently than `minReleaseAge` (default 72h) and not held back (see §7a) | medium |
| SI-REC-002 | New maintainer added on this version / maintainer set changed | high |
| SI-POP-001 | Name within edit distance 1–2 of a top-N package (typosquat) | high |
| SI-POP-002 | Very low weekly downloads + install script | medium |
| SI-INT-001 | Lockfile integrity hash missing or mismatches registry | block |
| SI-INT-002 | Resolved URL not on the configured registry | high |
| SI-DEP-001 | Package is deprecated / unpublished version | low |
| SI-VUL-001 | Known advisory (OSV API) | per advisory |

Top-N list and download counts come from the npm downloads API, cached daily.

## 7. Policy & trust

- **Global**: `$XDG_CONFIG_HOME/safe-install/config.json` (via `os.UserConfigDir`, so
  `%AppData%` on Windows, `~/Library/Application Support` on macOS).
- **Project**: `.safe-install.json` committed to the repo, so teams share approvals:

```json
{
  "allowScripts": {
    "esbuild@0.25.x": "approved",
    "sharp": { "approvedHash": "sha256-…", "by": "ben", "at": "2026-10-03" }
  },
  "minReleaseAge": "72h",
  "minReleaseAgeExclude": ["typescript", "@types/*"],
  "failOn": "high"
}
```

- Approvals pin to the **script content hash**, so a changed script needs re-approval
  even if the name is trusted.

## 7a. Release-age gate (prevent, don't just warn)

Inspired by [safe-npm](https://github.com/kevinslin/safe-npm) (ISC): instead of only warning
about fresh versions, **resolve to the newest version that is at least `minReleaseAge` old**,
so a freshly compromised release never lands.

- **Prefer the PM's native setting** when it exists (npm `--before <date>`, pnpm
  `minimumReleaseAge`; yarn/bun equivalents verified per version in CI). safe-install
  computes the value from policy and passes it through.
- **Fallback** (PM without native support): safe-install resolves direct dependencies itself
  (semver range ∩ age cutoff, newest wins) and pins them; transitive deps are then caught by
  SI-REC-001 as findings.
- `minReleaseAgeExclude` (glob list) bypasses the gate for trusted fast movers; `--min-age`
  overrides per run; `--min-age 0` disables.

## 8. CLI surface

```
safe-install                     # detect PM, analyze, install safely (interactive)
safe-install add <pkg>[@ver]     # analyze one package before adding it
safe-install check               # analyze only, no install (CI: exit 1 on policy fail)
safe-install scripts             # list packages wanting scripts + approval state
safe-install approve <pkg>       # approve / --revoke
safe-install explain <rule-id>   # why a rule exists, how to resolve
safe-install install --monitor   # Linux: run approved scripts under runtime monitor

Global flags: --pm, --yes, --ci, --format=text|json|sarif, --offline, --registry, --min-age
```

Exit codes: `0` ok · `1` policy failure · `2` user aborted · `3` tool error.

## 9. Linux-only: runtime monitor

Runs approved scripts while observing them. Not available on macOS/Windows: the CLI
says so plainly and points to the docs.

- **Backend**: eBPF (tracepoints `sys_enter_execve`, `connect`, `openat`) when
  CAP_BPF/root is available; else `strace -f -e trace=execve,connect,openat` fallback;
  else disabled with a message.
- **Signals**: unexpected network destinations (not the registry), spawning shells/
  downloaders, reads of secret paths, writes outside the project / `node_modules` /
  cache, writes to shell rc files, `~/.ssh`, `/etc`, cron, systemd units.
- **Action**: report by default; `--monitor=kill` terminates the process tree on a
  high-severity event.
- **Later**: sandbox mode (user + mount + net namespaces, Landlock) to deny instead of observe.

## 10. Roadmap (weekend-sized milestones)

| # | Milestone | Done when |
|---|---|---|
| M1 | Skeleton: cobra, PM detection, npm adapter, `--ignore-scripts` proxy, GoReleaser snapshot build on 3 OSes | binary installs a project with no scripts executed |
| M2 | Lockfile parsers: npm + pnpm + yarn v1 + yarn berry + bun → unified Graph | golden tests on real lockfiles of each format |
| M3 | Registry client + cache (+ `SAFE_INSTALL_REGISTRY_FIXTURES` file mode for tests), release-age gate (§7a), recency/maintainer/deprecation rules, risk engine, text report | `check` prints scored findings for full tree |
| M4 | Script extraction + static rules, interactive approve flow, run approved scripts (all 5 adapters) | esbuild/sharp approved and built; a fake malicious fixture blocked |
| M5 | Policy files (incl. `minReleaseAgeExclude`), content-hash approvals, `shell-init`, `approve`/`scripts`/`explain` commands | re-approval triggers when a script changes |
| M6 | Typosquat + popularity + OSV rules; JSON/SARIF; `--ci` mode; GitHub Action | CI job fails on a seeded bad dep |
| M7 | Linux monitor (strace backend first, eBPF second) | fixture that curls + writes `~/.bashrc` is reported/killed |
| M8 | Release 0.1.0: signed artifacts, Homebrew/Scoop/deb/rpm, docs, website | `brew install` / `scoop install` work |

## 11. Testing

- **Fixtures**: one sample project per PM with real lockfiles (checked in).
- **Malicious corpus**: hand-written harmless "malicious-looking" packages served from a
  local test registry (Verdaccio in CI). Never ship real malware.
- **Integration matrix**: GitHub Actions on `ubuntu`, `macos`, `windows` × each PM.
- **Registry**: recorded HTTP responses for unit tests; a fixtures-file mode
  (`SAFE_INSTALL_REGISTRY_FIXTURES=path.json`) for CLI e2e; live tests behind a build tag.

## 12. Repo hygiene (it's a security tool)

- `LICENSE` (Apache-2.0), `SECURITY.md` (private disclosure), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
- Minimal dependencies, all pinned; Dependabot + `govulncheck` in CI.
- Signed releases (cosign keyless) + SLSA provenance; reproducible builds (`-trimpath`).
- OpenSSF Scorecard badge as a goal.

## 13. Decisions (formerly open questions)

- **Yarn berry PnP**: supported. Approved scripts run via `yarn rebuild <pkg>`, verified by an
  integration test in M4. If PnP blocks it, document as a known limitation, don't hack around it.
- **Shell alias**: yes, opt-in only: `safe-install shell-init <bash|zsh|fish|pwsh>` prints
  aliases the user adds themselves. Never modifies rc files on its own (M5).
- **Telemetry**: none, ever. Stated in README and on the website.

## 14. After v1

- Passthrough: forward every non-install subcommand to the detected PM so `safe-install`
  can fully stand in for `npm`/`pnpm`/`yarn`/`bun`.
- Credit safe-npm in README for the release-age idea.
