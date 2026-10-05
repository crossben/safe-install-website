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
| Linux monitor | `strace` (eBPF deferred until after v1, see §13) | Runtime visibility on Linux only. |
| Testing | `testing` + golden files, `testscript` (rogpeppe/go-internal) for CLI e2e | Fixtures of real lockfiles and malicious-script corpora. |
| Release | **GoReleaser** + GitHub Actions | Builds linux/darwin/windows × amd64/arm64; publishes GitHub Releases, Homebrew tap, Scoop bucket, `.deb`/`.rpm`, checksums, **cosign signatures + SLSA provenance**. |
| Lint | `golangci-lint`, `govulncheck` | We must be a clean dependency ourselves. |

We deliberately **do not** distribute primarily via npm: a supply-chain security tool
installed through the channel it protects is a weak story. (An npm shim package that downloads
the signed binary can come later, with checksum verification.)

## 4. Package managers supported in v1

| PM | Lockfile | Disable scripts | Run approved scripts |
|---|---|---|---|
| npm | `package-lock.json` (v2/v3) | `npm install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |
| pnpm | `pnpm-lock.yaml` (v6–v9) | `pnpm install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |
| Yarn classic | `yarn.lock` (v1) | `yarn install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |
| Yarn berry | `yarn.lock` (YAML, v2+) | `yarn install --mode=skip-build` (`enableScripts=false` misses the project's own scripts and stops unplugging) | `npm run <stage>` in `.yarn/unplugged/…` with `NODE_OPTIONS=--require .pnp.cjs` (`yarn rebuild` also runs the project's pending scripts) |
| bun | `bun.lock` (text, ≥1.2) | `bun install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |

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
| SI-SCR-002 | Script downloads + executes (`curl … \| sh`, `wget … \| bash`, `iwr … \| iex`, encoded PowerShell) | block |
| SI-SCR-003 | Script (or the file it runs) uses `eval` / `new Function`, or contains a long base64 / hex blob | high |
| SI-SCR-004 | Script (or the file it runs) references credentials (`~/.ssh`, `~/.npmrc`, `~/.aws`, `.git-credentials`, browser profiles, `NPM_TOKEN`…) | high |
| SI-SCR-005 | Script changed vs. the previously approved version | high (re-approval) |
| SI-REC-001 | Version published more recently than `minReleaseAge` (default 72h) and not held back (see §7a) | medium |
| SI-REC-002 | Recent release (≤90d) that dropped provenance vs. the previous version, or was published by a never-seen human publisher (trusted publishing exempt) → high; maintainers added → low | high / low |
| SI-POP-001 | Name one edit (or only case/separators) away from a top-1000 package, and not itself in the ~16k popular list | high |
| SI-POP-002 | < 1000 weekly downloads + install script (counts fetched only for such packages) | medium |
| SI-INT-001 | Lockfile integrity hash mismatches the registry (same algorithm) | block |
| SI-INT-002 | Resolved URL not on the configured registry | high |
| SI-DEP-001 | Package is deprecated / unpublished version | low |
| SI-VUL-001 | OSV: `MAL-*` malicious package → block; advisories one level below their severity (critical→high, high→medium, else low) | block / per advisory |
| SI-MON-001 | Runtime monitor: script connected to the network (DNS ignored) | medium |
| SI-MON-002 | Runtime monitor: script ran a network tool (curl, wget, nc, ssh…) | medium |
| SI-MON-003 | Runtime monitor: script read credentials (`~/.ssh`, `~/.npmrc`, cloud, browser data) | high |
| SI-MON-004 | Runtime monitor: script wrote to a persistence location (shell rc, `~/.ssh`, autostart, systemd, git hooks, system dirs) | high |
| SI-MON-005 | Runtime monitor: script wrote outside the project and caches | medium |

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

Exit codes: `0` ok · `1` policy failure · `3` tool error. (Declining a prompt skips that
script; it is not an error, so `2` is reserved and never returned.)

## 9. Linux-only: runtime monitor

Runs approved scripts while observing them. Not available on macOS/Windows: the CLI says so
plainly.

- **Backend**: `strace -f` on the script only (safe-install is passed as npm's
  `--script-shell`), tracing exec, connect, open/creat, rename and unlink. No root needed.
  eBPF is deferred until after v1 (§13).
- **Signals**: network connections (SI-MON-001), network tools such as curl/wget/nc/ssh
  (SI-MON-002), credential reads (SI-MON-003), writes to persistence locations: shell rc
  files, `~/.ssh`, autostart, systemd, git hooks, system dirs (SI-MON-004), writes outside
  the project and caches (SI-MON-005).
- **Action**: report by default; `--monitor=kill` kills the script's process group on the
  first high-severity event. strace reports a syscall after it happened, so the first
  dangerous action is not prevented; later ones are.
- **Later**: sandbox mode (user + mount + net namespaces, Landlock) to deny instead of observe.

## 10. Roadmap (weekend-sized milestones)

| # | Milestone | Done when |
|---|---|---|
| M1 | Skeleton: cobra, PM detection, npm adapter, `--ignore-scripts` proxy, GoReleaser snapshot build on 3 OSes | binary installs a project with no scripts executed |
| M2 | Lockfile parsers: npm + pnpm + yarn v1 + yarn berry + bun → unified Graph | golden tests on real lockfiles of each format |
| M3 | Registry client + cache (+ `SAFE_INSTALL_REGISTRY_FIXTURES` file mode for tests), release-age gate (§7a), recency/maintainer/deprecation rules, risk engine, text report | `check` prints scored findings for full tree |
| M4 | Script extraction + static rules, interactive approve flow, run approved scripts (all 5 adapters) | esbuild/sharp approved and built; a fake malicious fixture blocked |
| M5 | Policy files (incl. `minReleaseAgeExclude`), content-hash approvals, `shell-init`, `approve`/`scripts`/`explain` commands | re-approval triggers when a script changes |
| M6 | Typosquat + popularity + OSV rules (SI-INT-001/002 shipped in M3); JSON/SARIF; `--ci` mode; GitHub Action | CI job fails on a seeded bad dep |
| M7 | Linux monitor (strace; eBPF deferred, see §13) | fixture that curls + writes `~/.bashrc` is reported/killed |
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

- **Yarn berry PnP**: supported (verified in M4). `yarn rebuild <pkg>` turned out to also run
  the project's own pending scripts, so approved scripts run directly from berry's unplugged
  copies with `.pnp.cjs` preloaded, the documented way to run Node under PnP.
- **Running approved scripts** (M4): every PM uses `npm run <stage> --ignore-scripts` in the
  package's directory (runs exactly that stage, no pre/post hooks). Needs npm on PATH.
- **Prompts** (M4): plain stdin prompts instead of `charmbracelet/huh`, one dependency fewer.
- **Yarn classic** has no native release-age setting: `install` says so; `check` still flags.
- **Shell alias**: yes, opt-in only: `safe-install shell-init <bash|zsh|fish|pwsh>` prints
  aliases the user adds themselves. Never modifies rc files on its own (M5).
- **Telemetry**: none, ever. Stated in README and on the website.
- **Policy format** (M5): `allowScripts` is keyed by package name; each approval stores
  `version` (informational), `hash` (scripts + files they run) and `at`. Any version whose
  scripts hash the same stays approved; a different hash is SI-SCR-005 and re-prompts.
- **`add`** shipped in M5 (needed by `shell-init`: pnpm/yarn reject names on `install`).
- **`minReleaseAgeExclude`** applies to findings only; the age given to the package manager
  (npm `--before`, etc.) is global.
- **Config dir override**: `SAFE_INSTALL_CONFIG_DIR` (used by tests).
- **Popular list** (M6): embedded from npm-high-impact (MIT), regenerated by
  `scripts/update-popular.sh`. Top-N comes from there, not a daily download fetch.
- **Registry 404** (M6): a finding (unpublished?), not a tool error, and still sent to OSV,
  because malicious packages are usually unpublished.
- **GitHub Action** (M6): composite `action.yml` that builds from source until M8 releases;
  `.github/workflows/action.yml` asserts it fails on a seeded malicious dependency.
- **Runtime monitor** (M7): strace only. Scope is exactly the scripts: the runner passes
  `--script-shell=<safe-install>`, which runs `strace -f -- /bin/sh -c <script>`; nested
  `npm run` inside a traced script runs plain (already traced). Kill mode acts after the
  syscall. **eBPF deferred**: it needs root/CAP_BPF, which could not be tested in
  development; revisit after v1 together with an enforcing sandbox (Landlock/seccomp).
- **Install-time review ignores ordinary advisories** (M7 fix): only `MAL-*` entries affect
  whether a script may run; `check` still reports vulnerabilities.
- **Release** (M8): GoReleaser with `homebrew_casks` (`brews` is deprecated) in `Casks/` and a
  Scoop manifest in `bucket/` of this repo, committed by the release job with the built-in
  token (no extra repos or secrets). Version-less archive names so `releases/latest/download`
  works for the Action. macOS: no auto-removal of the quarantine flag (caveat instead);
  Apple notarization is a later, paid option. Release footer + README document
  `cosign verify-blob` and `gh attestation verify`.
- **Test-only env**: `SAFE_INSTALL_OSV_URL`, `SAFE_INSTALL_DOWNLOADS_URL` (`off` disables).

## 14. After v1

- Passthrough: forward every non-install subcommand to the detected PM so `safe-install`
  can fully stand in for `npm`/`pnpm`/`yarn`/`bun`.
- Credit safe-npm in README for the release-age idea.

## 15. v0.2 roadmap (agreed 2026-10-05; review stop after each)

| # | Milestone | Done when |
|---|---|---|
| N1 | Registry config from `.npmrc` / `.yarnrc.yml`: default + scoped registries, per-host auth (`_authToken`, `_auth`, user/password, `${ENV}`); tokens only ever sent to their own host | `check` works against an authenticated private registry; no SI-INT-002 false positives |
| N2 | `check --diff <git-ref or lockfile>`: only new/changed packages; Action uses it on PRs | a PR adding 1 package reports 1 package |
| N3 | `safe-install why <pkg>`: dependency paths from the roots | paths printed for direct, transitive, dev, workspace |
| N4 | Whole-package code scan of new/changed packages (SCR patterns on JS files, minified-noise controls) | an obfuscated `index.js` payload is flagged; popular packages stay quiet |
| N5 | Linux sandbox for approved scripts (Landlock + network namespace) | a script cannot write `~/.bashrc` or reach the network unless allowed |
| N6 | Approval scopes and expiry (`@scope/*`, `expires`, provenance-only) | scoped approval covers a new esbuild release with unchanged publisher |
| N7 | Organization policy layered under the project file | org approvals/blocks apply across repos |
| N8 | Passthrough of non-install commands to the PM | `safe-install run build` == `npm run build` |
| N9 | Early warning when npm is missing for approved scripts | warned before installing |
| N10 | Hostnames in SI-MON-001 | `connects to registry.npmjs.org (104.16.x.x:443)` |
| N11 | `cache clean` and a cache size cap | cache stays under the cap |
| N12 | Action PR summary comment | PR shows a short findings comment |

