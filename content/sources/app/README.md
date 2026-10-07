# safe-install

**Install dependencies. Not malware.**

`safe-install` stops malicious npm, pnpm, Yarn and bun install scripts before they run.
It analyzes your whole dependency tree from the lockfile, installs with lifecycle scripts
disabled, shows you every package that wants to run a script, and runs only the ones you
approved. Linux, macOS and Windows; single static binary.

## How it works

1. **Analyze**: lockfile → full tree → registry metadata → risk score per package
2. **Install**: your package manager, with all lifecycle scripts disabled
3. **Inspect**: list every package that wants a `preinstall`/`install`/`postinstall` script, and flag risky ones
4. **Approve**: per package, pinned to the script's content hash
5. **Run**: only the approved scripts (Linux: optionally under a runtime monitor)

## Supported package managers

| Package manager | Lockfile | Install with scripts off | Approved scripts run with |
| --- | --- | --- | --- |
| npm | `package-lock.json` (v2/v3) | `npm install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |
| pnpm | `pnpm-lock.yaml` (v6, v9) | `pnpm install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |
| Yarn classic | `yarn.lock` (v1) | `yarn install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |
| Yarn berry | `yarn.lock` (v2+) | `yarn install --mode=skip-build` | `npm run <stage> --ignore-scripts` in `.yarn/unplugged`, with `.pnp.cjs` preloaded |
| bun | `bun.lock` | `bun install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |

The package manager is detected from the lockfile, then the `packageManager` field in
`package.json` (`--pm` overrides both). When `packageManager` pins pnpm or Yarn,
safe-install runs it through corepack so you get exactly that version.

## Get it

```sh
# macOS / Linux (Homebrew)
brew tap crossben/safe-install https://github.com/crossben/safe-install
brew install --cask safe-install

# Windows (Scoop)
scoop bucket add safe-install https://github.com/crossben/safe-install
scoop install safe-install

# Debian / Ubuntu, Fedora / RHEL, Alpine: download the .deb / .rpm / .apk from the latest release
sudo apt install ./safe-install_*_linux_amd64.deb

# Anything else: download an archive from the releases page, or build from source (Go 1.25+)
go install github.com/crossben/safe-install/cmd/safe-install@latest
```

On macOS, Homebrew keeps the quarantine flag on the (not yet notarized) binary; the cask
prints the one-line `xattr` command to clear it yourself.

safe-install is deliberately **not** distributed through npm: a supply-chain tool should
not be installed through the channel it protects.

### Verify a download

Every release signs `checksums.txt` with [Sigstore](https://www.sigstore.dev/) (keyless,
bound to this repository's release workflow) and attaches SLSA build provenance:

```sh
cosign verify-blob checksums.txt \
  --bundle checksums.txt.sigstore.json \
  --certificate-identity-regexp '^https://github.com/crossben/safe-install/\.github/workflows/release\.yml@refs/tags/v' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
sha256sum --ignore-missing -c checksums.txt

gh attestation verify safe-install_linux_amd64.tar.gz --repo crossben/safe-install
```

v0.1.0 predates the bundle format: verify it with `--signature checksums.txt.sig
--certificate checksums.txt.pem` instead of `--bundle`.

## Usage

```sh
safe-install                 # or: safe-install install
safe-install install --yes   # approve every script below high risk
safe-install install -- --omit=dev   # flags after -- go to the package manager
safe-install ci              # clean install from the lockfile (npm ci, --frozen-lockfile, --immutable)
```

Dependencies are installed with every lifecycle script disabled. safe-install then lists
the packages that want to run `preinstall` / `install` / `postinstall` scripts, flags
risky ones (download-and-execute, `eval` / encoded blobs, credential access, plus the
registry checks below), and runs only the ones you approve, dependencies first. Without a
terminal (CI) nothing is approved; `--ci` also exits 1 when a high-risk script is present.
Your project's own lifecycle scripts are never run for you.

Running approved scripts uses `npm run` inside each package's directory, so npm must be
on `PATH` (it ships with Node); `install` warns up front when it is missing.

## Code scanning

Install scripts are not the only way in: code can also run when your app imports a
package. Every install (and `safe-install scan`) also scans the JavaScript of each
installed package for three shapes, each a combination rather than a single keyword:
code that **downloads and executes** (`SI-CODE-001`), code that **reads credentials next to
a network send** (`SI-CODE-002`) and **obfuscated** code (`SI-CODE-003`). Results are cached
per package version, so each version is scanned once. A high finding fails `--ci`; a
script package with code findings is not approved by `--yes`. Files over 2 MB (bundles)
are not scanned. `check --deep` does the same without installing: it downloads each
checked package's tarball, verifies it against the lockfile's integrity hash (a mismatch
blocks, as `SI-INT-001`), and scans it in memory; nothing is extracted to disk.

## Runtime monitor (Linux)

```sh
safe-install install --monitor        # report what approved scripts do
safe-install install --monitor=kill   # stop a script after its first high-risk action
```

Approved scripts run under `strace` (install it with your package manager; no root
needed). safe-install reports network connections, network tools (`curl`, `wget`, `nc`…),
reads of credentials (`~/.ssh`, `~/.npmrc`, cloud and browser data) and writes to
persistence locations (shell startup files, `~/.ssh`, autostart, systemd, git hooks,
system directories) or anywhere outside the project and caches. Only the scripts are
traced, not the package manager. strace sees a syscall once it happened, so `kill` stops
the script *after* the first dangerous action, not before it. Network findings name the host the script looked up (`connects to registry.npmjs.org:443`),
from the DNS replies it received; only replies from the system's name servers
(`/etc/resolv.conf`) count, so a script cannot forge one to disguise where it connects. On macOS and Windows,
`--monitor` is not available; everything else works the same.

## Sandbox (Linux)

```sh
safe-install install --sandbox              # approved scripts can't see your home folder or the network
safe-install install --sandbox --sandbox-net  # …but may download (puppeteer, prebuilt binaries)
```

`--sandbox` runs each approved script under [Landlock](https://docs.kernel.org/userspace-api/landlock.html)
(no root needed): it can read the system and the project, write only to its package, the
project's `node_modules`, temp folders and package caches, and cannot open the rest of your
home folder, so `~/.ssh`, `~/.aws`, `~/.npmrc`, browser profiles and `~/.bashrc` are out of
reach. Outgoing TCP is blocked unless you pass `--sandbox-net` (UDP too on Linux 6.15+-class
kernels with Landlock ABI 10). Only the scripts are sandboxed, not the package manager.
Combine it with `--monitor` to see what a blocked script tried.

The sandbox blocks rather than reports: a script that genuinely needs something outside
those paths fails ("permission denied"). It needs Landlock (Linux 5.13+; 6.7+ to block the
network) and refuses to run rather than silently doing less.

## Approvals and policy

Answering **y** at the prompt (or running `safe-install approve <pkg>`) records the approval
in `.safe-install.json`. Commit it so your team shares approvals:

```json
{
  "minReleaseAge": "3d",
  "minReleaseAgeExclude": ["typescript", "@types/*"],
  "failOn": "high",
  "allowScripts": {
    "esbuild": { "version": "0.25.10", "hash": "sha256-…", "at": "2026-10-03" }
  }
}
```

An approval is pinned to a hash of the scripts **and the files they run**: if either
changes, safe-install reports `SI-SCR-005` and asks again. Two options loosen or tighten that:

```sh
safe-install approve sharp --trust provenance   # also future versions built by the same repository's CI
safe-install approve '@corp/*' --trust provenance  # a whole scope (globs need provenance)
safe-install approve esbuild --expires 90d      # ask again after 90 days
```

With `--trust provenance`, changed scripts are accepted only when the new version carries
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) from the
repository recorded at approval time; a release published by hand (a stolen token) or built
from another repository is not. safe-install reads the provenance the registry serves; it
does not re-verify its Sigstore signature. Exact names take precedence over globs. Approved scripts run without a
prompt, also in CI. A user-wide file with the same format lives in your config directory
(`approve --global`); the project file wins on conflicts, and flags win over both.

```sh
safe-install scripts              # packages with install scripts and their approval state
safe-install approve esbuild      # approve and run now (--revoke, --global, --no-run)
safe-install add left-pad         # add packages through the same review
safe-install explain SI-SCR-002   # what a rule means and what to do
safe-install why ms               # the dependency chains that bring a package in
safe-install scan                 # scan installed packages' code (also part of every install)
safe-install cache info           # cache size per part; `cache clean` empties it
```

`minReleaseAgeExclude` exempts packages from the release-age findings. The age passed to
the package manager itself applies to every package.

### Organization policy

A security team can publish one policy for every repository: a JSON file in the same
format, plus `blockPackages` (name globs that must never be used). Point safe-install at
it with `SAFE_INSTALL_ORG_POLICY` or `"orgPolicy": "https://…/policy.json"` (or a path) in
your user config, which win, or in `.safe-install.json`. `SAFE_INSTALL_ORG_POLICY_TOKEN` is
sent as a Bearer token to that host only, and never to a URL named by a project file:
anyone can change one in a pull request.

```json
{
  "minReleaseAge": "7d",
  "failOn": "medium",
  "blockPackages": ["event-stream", "@evil/*"],
  "allowScripts": { "esbuild": { "trust": "provenance", "repository": "https://github.com/evanw/esbuild" } }
}
```

Projects build on it but cannot weaken it: blocked packages are reported as `SI-POL-001`
(blocking) and their scripts never run, even if a project approved them; `minReleaseAge`
and `failOn` are at least as strict as the organization's. The policy must be https; if it
cannot be fetched, the last cached copy is used with a warning, and with no cache
safe-install stops rather than running without it.

### Use it instead of your package manager

Commands that run no dependency code go to your project's package manager, with its output
and exit code: your own scripts (`safe-install run build`, `test`, `start`, and script names
directly for Yarn, pnpm and bun) and read-only or publishing commands (`ls`, `outdated`,
`view`, `why`, `audit`, `pack`, `publish`, …). Install verbs (`i`, `install`, `add`, `ci`) take
safe-install's own reviewed path; `uninstall` / `remove` run with install scripts forced off.
Everything else is refused, with what to do instead: that includes `update`, `rebuild`,
`exec`, `dlx`, `create`, `audit fix`, `dedupe`, and any command safe-install does not know.

### Use it every time (opt-in)

`safe-install shell-init <bash|zsh|fish|pwsh>` prints functions that send `npm install`,
`pnpm add`, `yarn`, `bun i` and friends through safe-install. It changes nothing on its own:

```sh
eval "$(safe-install shell-init bash)"   # add to ~/.bashrc or ~/.zshrc
```

## AI coding agents

Coding agents (Claude Code, Codex, Cursor…) install packages too, and they shouldn't approve
install scripts on your behalf. `safe-install llm` prints instructions written for them:
install through safe-install, never approve scripts, report skipped ones to you, and
how to read the results. Add them to your agent's instructions file:

```sh
safe-install llm >> AGENTS.md      # or CLAUDE.md, .cursorrules, …
```

## Check without installing

```sh
safe-install check                  # score every package in the lockfile
safe-install check --fail-on medium # exit 1 at medium risk or worse
safe-install check --format json    # or sarif, markdown; --sarif-file x.sarif writes SARIF alongside text
safe-install check --summary-file summary.md   # plus a short Markdown summary (for PR comments)
safe-install check --diff origin/main  # only packages new or changed since a git ref (or an old lockfile)
safe-install check --diff origin/main --deep  # …and download, verify and scan their code
```

New versions must be at least `--min-age` old (default `72h`; `0` disables). `install`
passes this to the package manager so fresh releases are not picked up, and `check`
flags any already in the lockfile.

Exit codes: `0` ok · `1` a package reached `--fail-on` (or, with `--ci`, an unapproved
high-risk script or high-risk monitor finding) · `3` tool error, such as registry
metadata that could not be fetched.

Besides the registry checks, `check` flags names that imitate popular packages, rarely
downloaded packages that run install scripts, and anything in the [OSV](https://osv.dev)
database. OSV's malicious-package entries (`MAL-…`) **block**; ordinary vulnerabilities
count one level below their advisory severity (`npm audit` covers those in depth).
`safe-install explain` lists every rule.

## GitHub Action

```yaml
- uses: crossben/safe-install@v0.2.2
  with:
    working-directory: .   # where package.json and the lockfile are
    fail-on: high          # low, medium, high, block, none
    sarif: true            # upload to code scanning (needs security-events: write)
    comment: true          # comment on the PR (needs pull-requests: write)
```

The action downloads the release binary for the runner (checksum-verified; `version:`
picks a release, `source` builds from the action's checkout) and fails the job when a
package reaches `fail-on`. On pull requests it checks only the packages the PR adds or
upgrades (`diff: auto`, comparing with the base branch) and scans their code
(`deep: auto`); set `diff: none` to always check everything.

A short summary of the risky packages goes to the job summary on every run. With
`comment: true`, it is also posted on the pull request, but only when there is something
to report. Later runs edit that one comment instead of adding new ones. Package names and
messages are shown as code, so a package can't put links, images or @mentions in the
comment. On pull requests from forks the token is read-only, so the comment is skipped
with a warning.

## Private registries

safe-install reads registries and credentials where your package manager does: the
project's `.npmrc`, your user `.npmrc` (or `$NPM_CONFIG_USERCONFIG`), the project's
`.yarnrc.yml` (Yarn berry) and `npm_config_registry`; `--registry` overrides the default.
Scoped registries (`@corp:registry=…`) and per-host credentials (`_authToken`, `_auth`,
`username` / `_password`, with `${ENV}` expansion) are supported:

```ini
@corp:registry=https://npm.corp.example.com/
//npm.corp.example.com/:_authToken=${NPM_TOKEN}
```

A credential is sent only to the registry host and path it is configured for, never to
OSV or npm's download counts API, and never printed. Tarballs from any configured
registry count as the registry for `SI-INT-002`.

## Cache

Registry metadata, code-scan results, the organization policy and the last update check are cached under
`safe-install cache dir` (`SAFE_INSTALL_CACHE_DIR` moves it). The cache is capped at 1 GB
(`SAFE_INSTALL_CACHE_MAX`, e.g. `500MB`): after each command, the least recently used files
are removed once it is over the cap. `safe-install cache clean [registry|codescan|org|update]`
empties it.

## Privacy

No telemetry. `safe-install` talks to your configured package registry, the
[OSV API](https://osv.dev) (package names and versions, for advisories) and npm's download
counts API (only for rarely used packages with install scripts). `--offline` uses cached
registry data only and skips both.

At most once a day, in an interactive terminal, safe-install also asks GitHub's API for
the latest release and prints a one-line notice with the right update command when there is
a newer one. The request carries nothing about you or your project. It never runs in CI,
with `--ci` or `--offline`, or when `SAFE_INSTALL_NO_UPDATE_CHECK=1` is set.

## Security

Found a bypass? Please report it privately, see [SECURITY.md](SECURITY.md).

## Acknowledgements

The release-age gate is inspired by [safe-npm](https://github.com/kevinslin/safe-npm).
The popular-package list comes from [npm-high-impact](https://github.com/wooorm/npm-high-impact)
(MIT, Titus Wormer); refresh it with `scripts/update-popular.sh`.

## License

[Apache-2.0](LICENSE)
