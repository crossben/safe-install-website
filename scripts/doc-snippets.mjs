/**
 * Every code block the docs pages show, by id. Each is the one fenced block of
 * `file` containing `marker`: the docs quote the CLI's own README verbatim and
 * never retype a command. `check-facts.mjs` fails the build when a marker
 * matches zero or several blocks (refresh the README with `npm run sync:sources`).
 */
const README = 'content/sources/app/README.md';

export const DOC_SNIPPETS = {
  'install.channels': { file: README, marker: 'brew tap crossben/safe-install' },
  'install.verify': { file: README, marker: 'cosign verify-blob checksums.txt' },
  'usage.install': { file: README, marker: 'safe-install install --yes' },
  'usage.commands': { file: README, marker: 'safe-install scripts ' },
  'usage.shellInit': { file: README, marker: 'eval "$(safe-install shell-init bash)"' },
  'policy.file': { file: README, marker: '"allowScripts"' },
  'check.commands': { file: README, marker: 'safe-install check --fail-on medium' },
  'ci.action': { file: README, marker: 'uses: crossben/safe-install@' },
  'monitor.commands': { file: README, marker: 'safe-install install --monitor=kill' },
};

/** The CLI's rule explanations (`safe-install explain`). */
export const EXPLAIN_FILE = 'content/sources/app/explain.go';
