#!/usr/bin/env node
/**
 * Refreshes `content/sources/plan.md` from the workspace-root `plan.md`.
 *
 * The product plan lives at the root of the parent workspace, which is
 * deliberately not committed (§5: "Each is its own public git repo; the root
 * (plan, prompts) is not committed"). Facts in `content/facts.ts` cite the
 * vendored snapshot instead, so a clean clone of this repo can verify its own
 * claims. Run this after editing the plan, then commit the snapshot alongside
 * whatever claim changes it caused to fail.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, '..');

const upstream = path.resolve(websiteRoot, '..', 'plan.md');
const snapshot = path.join(websiteRoot, 'content', 'sources', 'plan.md');

if (!existsSync(upstream)) {
  console.error(
    `✗ sync-sources: no plan found at ${upstream}\n` +
      `  This site is its own repo; run this from a full workspace checkout.`,
  );
  process.exit(1);
}

const contents = await readFile(upstream, 'utf8');
const previous = existsSync(snapshot) ? await readFile(snapshot, 'utf8') : null;

await mkdir(path.dirname(snapshot), { recursive: true });
await writeFile(snapshot, contents, 'utf8');

if (previous === contents) {
  console.log('✓ sources: plan.md already up to date');
} else {
  console.log(
    `✓ sources: updated content/sources/plan.md (${contents.split('\n').length} lines)\n` +
      '  Now run `npm run check:facts` — any claim the plan no longer supports will fail.',
  );
}
