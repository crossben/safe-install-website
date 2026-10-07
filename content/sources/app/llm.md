# safe-install: instructions for AI coding agents

This project installs JavaScript dependencies through safe-install (https://github.com/crossben/safe-install). It installs packages with every install script (`preinstall`, `install`, `postinstall`) switched off, analyzes them, and runs only the scripts a human has approved. Follow these rules.

## Installing packages

- Use safe-install instead of calling npm, pnpm, yarn or bun directly to install:
  - `safe-install install` installs what the lockfile describes.
  - `safe-install add <package>[@version]` adds a dependency. Package manager flags go after `--`: `safe-install add -- -D vitest`.
- Other commands pass through to the project's package manager: `safe-install run build`, `safe-install test`, `safe-install ls`, `safe-install outdated`.
- Commands that could run unreviewed code (`exec`, `dlx`, `create`, `update`, `rebuild`, `audit fix`, `init <initializer>`) are refused. Do not work around a refusal.

## Never approve scripts yourself

Approving an install script lets that package run code on this machine. Only the human decides that. You must never:

- run `safe-install approve`, or use `--force` or `--yes`;
- edit `allowScripts` in `.safe-install.json` or the user config;
- lower `minReleaseAge` / `--min-age`, or add `blockPackages` exceptions;
- re-run the install with npm, pnpm, yarn or bun directly to get scripts to run.

When you run without a terminal, safe-install approves nothing new. It installs the packages, skips scripts that are not approved yet, and lists each skipped package with its scripts and findings. Stop and tell the human: the package name, its scripts, its risk level and findings, and the command for them to run themselves: `safe-install approve <package>`. Some packages (esbuild, sharp, native modules) may not work until their scripts run.

## Checking dependencies

- `safe-install check` scores every package in the lockfile without installing. `--format json` gives machine-readable results; `--diff origin/main` checks only new or changed packages; `--deep` also downloads and scans their code.
- `safe-install why <package> --format json` shows which dependency chains bring a package in.
- `safe-install explain <rule-id>` explains a finding, e.g. `SI-SCR-002`.
- Treat `block` and `high` findings as reasons to stop and ask the human, not to remove the check. Suggest an alternative package if one is clearly safer.

## Exit codes

- `0`: nothing reached the threshold. Skipped scripts still exit 0: read the output.
- `1`: a package reached `--fail-on`, or with `--ci`, an unapproved high-risk script.
- `3`: safe-install could not do its job (for example, registry metadata could not be fetched). Report it; do not fall back to installing without safe-install.

Use `--ci` in automation so high-risk findings fail the command instead of only being printed.
