# Changelog

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
