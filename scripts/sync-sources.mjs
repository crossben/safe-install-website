#!/usr/bin/env node
/**
 * Refreshes the vendored sources under `content/sources/` from the workspace:
 * the product plan (`../plan.md`) and a fixed list of files from the CLI
 * repository (`../app/`).
 *
 * The plan lives at the root of the parent workspace, which is deliberately not
 * committed, and the CLI is its own repository. Facts in `content/facts.ts` and
 * the docs snippets cite these snapshots instead, so a clean clone of this repo
 * can verify its own claims. Run this after the plan or the CLI changes, then
 * commit the snapshots alongside whatever claim changes they caused to fail.
 *
 * Only the files listed in SOURCES are copied: never the CLI's tests, and never
 * agent instruction files.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, '..');
const workspace = path.resolve(websiteRoot, '..');
const sourcesDir = path.join(websiteRoot, 'content', 'sources');

/** [path in the workspace, path under content/sources/] */
const SOURCES = [
  ['plan.md', 'plan.md'],
  ['app/README.md', 'app/README.md'],
  ['app/CHANGELOG.md', 'app/CHANGELOG.md'],
  ['app/action.yml', 'app/action.yml'],
  ['app/.goreleaser.yaml', 'app/goreleaser.yaml'],
  ['app/internal/analyze/explain.go', 'app/explain.go'],
  ['app/internal/cli/root.go', 'app/root.go'],
];

const missing = SOURCES.filter(([from]) => !existsSync(path.join(workspace, from)));
if (missing.length > 0) {
  console.error(
    `✗ sync-sources: not found in ${workspace}:\n` +
      missing.map(([from]) => `    ${from}`).join('\n') +
      '\n  This site is its own repo; run this from a full workspace checkout.',
  );
  process.exit(1);
}

let changed = 0;
for (const [from, to] of SOURCES) {
  const contents = await readFile(path.join(workspace, from), 'utf8');
  const target = path.join(sourcesDir, to);
  const previous = existsSync(target) ? await readFile(target, 'utf8') : null;
  if (previous === contents) continue;
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, 'utf8');
  console.log(`✓ sources: updated content/sources/${to}`);
  changed++;
}

if (changed === 0) {
  console.log('✓ sources: all snapshots up to date');
} else {
  console.log(
    '  Now run `npm run check:facts`: any claim the sources no longer support will fail.',
  );
}
