# Changelog

## 0.2.1

### Added

- A progress line (spinner and counter) while safe-install checks the registry, scans
  package code or downloads for `--deep`. Interactive terminals only.
- A notice when a newer release exists, with the update command for how you installed
  safe-install (Homebrew, Scoop, `go install`, or the release page). Checked at most once a
  day; never in CI, with `--ci` or `--offline`, or with `SAFE_INSTALL_NO_UPDATE_CHECK=1`.

## 0.2.0

### Added

- **Private registries**: registries and credentials come from `.npmrc` and `.yarnrc.yml`
  (scoped registries, per-host `_authToken` / `_auth` / username and password, `${ENV}`).
  A credential goes only to the registry it is configured for.
- **`check --diff <git-ref|lockfile>`** checks only new or changed packages. The GitHub
  Action does this on pull requests by default (`diff: auto`).
- **`why <pkg>[@ver]`**: the dependency chains that bring a package in.
- **Code scanning** (SI-CODE-001…003): every install and `safe-install scan` read the
  JavaScript of installed packages for download-and-execute, credential theft and
  obfuscation. Results are cached per version. `check --deep` downloads tarballs, verifies
  them against the lockfile and scans them in memory (Action: `deep: auto`).
- **Sandbox** (Linux, Landlock): `--sandbox` hides your home folder from approved scripts,
  confines writes and blocks the network (`--sandbox-net` allows it). No root needed.
- **Approval trust**: `approve --trust provenance` also accepts future versions built by
  the same repository's CI (npm provenance), scope globs like `@corp/*`, and
  `--expires 90d`.
- **Organization policy**: a shared policy from a path or an https URL, cached and fail
  closed, with `blockPackages` (SI-POL-001) and minimums projects cannot weaken.
- **Use it instead of your package manager**: run scripts and read-only verbs pass through;
  install verbs take the reviewed path; `uninstall` runs with scripts off; anything that
  could run dependency code is refused.
- `install` warns up front when npm, which runs approved scripts, is missing.
- The **runtime monitor** names hosts from the DNS replies of the system resolvers
  (`connects to registry.npmjs.org:443`).
- **`cache dir|info|clean`**: one cache root, capped at 1 GB (`SAFE_INSTALL_CACHE_MAX`),
  least recently used files pruned first.
- **Markdown summary**: `check --summary-file` / `--format markdown`. The Action writes it
  to the job summary, and with `comment: true` posts it on the pull request.

### Fixed

- Risk scores count each rule once: repeated advisories no longer add up to high.
- `--diff` finds the base lockfile through git's own paths (Windows short names, macOS
  `/private`, symlinks).

### Changed

- Release checksums are signed as Cosign 3 bundles (`checksums.txt.sigstore.json`).

## 0.1.0

First release.

- **Install with scripts off** for npm, pnpm, Yarn classic, Yarn berry (including
  Plug'n'Play) and bun; then review and run only approved install scripts, dependencies
  first. `install`, `add`, `approve`, `scripts`.
- **Script scanning**: download-and-execute, eval and encoded blobs, credential access
  (SI-SCR-001…004).
- **Approvals pinned to content**: scripts and the files they run are hashed; a change
  needs re-approval (SI-SCR-005). Shared through a committed `.safe-install.json`.
- **Release-age gate**: `--min-age` / `minReleaseAge`, passed to each package manager's
  native setting where it exists.
- **`check`**: lockfile parsers for six formats; registry, publisher/provenance,
  integrity, typosquat, popularity and OSV checks (`MAL-*` malware blocks); text, JSON and
  SARIF output.
- **Runtime monitor** (Linux, strace): `--monitor` reports, `--monitor=kill` stops scripts
  after network, credential or persistence behavior (SI-MON-001…005).
- **GitHub Action**, `shell-init` wrappers, `explain`.
- Signed releases (cosign keyless), SLSA provenance, SBOMs, Homebrew cask, Scoop
  manifest, deb/rpm/apk.
