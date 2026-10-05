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
```

Dependencies are installed with every lifecycle script disabled. safe-install then lists
the packages that want to run `preinstall` / `install` / `postinstall` scripts, flags
risky ones (download-and-execute, `eval` / encoded blobs, credential access, plus the
registry checks below), and runs only the ones you approve, dependencies first. Without a
terminal (CI) nothing is approved; `--ci` also exits 1 when a high-risk script is present.
Your project's own lifecycle scripts are never run for you.

Running approved scripts uses `npm run` inside each package's directory, so npm must be
on `PATH` (it ships with Node).

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
the script *after* the first dangerous action, not before it. On macOS and Windows,
`--monitor` is not available; everything else works the same.

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
changes, safe-install reports `SI-SCR-005` and asks again. Approved scripts run without a
prompt, also in CI. A user-wide file with the same format lives in your config directory
(`approve --global`); the project file wins on conflicts, and flags win over both.

```sh
safe-install scripts              # packages with install scripts and their approval state
safe-install approve esbuild      # approve and run now (--revoke, --global, --no-run)
safe-install add left-pad         # add packages through the same review
safe-install explain SI-SCR-002   # what a rule means and what to do
safe-install why ms               # the dependency chains that bring a package in
```

`minReleaseAgeExclude` exempts packages from the release-age findings. The age passed to
the package manager itself applies to every package.

### Use it every time (opt-in)

`safe-install shell-init <bash|zsh|fish|pwsh>` prints functions that send `npm install`,
`pnpm add`, `yarn`, `bun i` and friends through safe-install. It changes nothing on its own:

```sh
eval "$(safe-install shell-init bash)"   # add to ~/.bashrc or ~/.zshrc
```

## Check without installing

```sh
safe-install check                  # score every package in the lockfile
safe-install check --fail-on medium # exit 1 at medium risk or worse
safe-install check --format json    # or sarif; --sarif-file x.sarif writes SARIF alongside text
safe-install check --diff origin/main  # only packages new or changed since a git ref (or an old lockfile)
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
- uses: crossben/safe-install@v0.1.0
  with:
    working-directory: .   # where package.json and the lockfile are
    fail-on: high          # low, medium, high, block, none
    sarif: true            # upload to code scanning (needs security-events: write)
```

The action downloads the release binary for the runner (checksum-verified; `version:`
picks a release, `source` builds from the action's checkout) and fails the job when a
package reaches `fail-on`. On pull requests it checks only the packages the PR adds or
upgrades (`diff: auto`, comparing with the base branch); set `diff: none` to always check
everything.

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

## Privacy

No telemetry. `safe-install` talks to your configured package registry, the
[OSV API](https://osv.dev) (package names and versions, for advisories) and npm's download
counts API (only for rarely used packages with install scripts). `--offline` uses cached
registry data only and skips both.

## Security

Found a bypass? Please report it privately, see [SECURITY.md](SECURITY.md).

## Acknowledgements

The release-age gate is inspired by [safe-npm](https://github.com/kevinslin/safe-npm).
The popular-package list comes from [npm-high-impact](https://github.com/wooorm/npm-high-impact)
(MIT, Titus Wormer); refresh it with `scripts/update-popular.sh`.

## License

[Apache-2.0](LICENSE)
