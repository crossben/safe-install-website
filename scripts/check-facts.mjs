#!/usr/bin/env node
/**
 * Fails the build when a claim in `content/facts.ts` is no longer backed by the
 * text it cites.
 *
 * Walks the exported `facts` tree, collects every `Fact` (`{ value, source }`)
 * and every `Rule` / `PackageManager` / `CliCommand` (which carry a `source`
 * directly), then checks that each `source.quote` is an exact substring of
 * `source.file`. A missing file is also a failure — if the plan is renamed or
 * the Go repo replaces it, this forces every claim to be repointed.
 *
 * Run automatically via `predev` and `prebuild`.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, '..');

/** Files are read once and cached; many facts cite the same source. */
const fileCache = new Map();

async function readSourceFile(relativePath) {
  const absolute = path.resolve(websiteRoot, relativePath);
  if (fileCache.has(absolute)) return fileCache.get(absolute);

  if (!existsSync(absolute)) {
    fileCache.set(absolute, { missing: true });
    return fileCache.get(absolute);
  }
  const contents = await readFile(absolute, 'utf8');
  fileCache.set(absolute, { contents });
  return fileCache.get(absolute);
}

/**
 * Collects every object carrying a `{ section, file, quote }` source.
 * Walks arrays and plain objects; stops descending once it finds one.
 */
function collectSources(node, trail, out) {
  if (node === null || typeof node !== 'object') return;

  if (!Array.isArray(node) && isSource(node.source)) {
    out.push({ source: node.source, trail });
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => collectSources(item, `${trail}[${i}]`, out));
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    collectSources(value, trail ? `${trail}.${key}` : key, out);
  }
}

function isSource(candidate) {
  return (
    candidate !== null &&
    typeof candidate === 'object' &&
    typeof candidate.section === 'string' &&
    typeof candidate.file === 'string' &&
    typeof candidate.quote === 'string'
  );
}

/** Multi-line quotes are authored across several lines for readability. */
function normalizeWhitespace(text) {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
}

async function main() {
  const factsModule = await import(path.join(websiteRoot, 'content/facts.ts'));

  // Every export is walked, so adding a new exported claim is covered
  // automatically — there is no registry to forget to update.
  const found = [];
  for (const [exportName, exported] of Object.entries(factsModule)) {
    if (typeof exported === 'function') continue; // the `fact` helper itself
    collectSources(exported, exportName, found);
  }

  if (found.length === 0) {
    fail('Found no sourced facts in content/facts.ts. Did the export shape change?');
  }

  const failures = [];
  let checkedFiles = 0;

  for (const { source, trail } of found) {
    const file = await readSourceFile(source.file);
    const label = trail ? `facts${trail}` : '(top level)';

    if (file.missing) {
      failures.push(
        `${label}\n    cited file not found: ${source.file}\n    section: ${source.section}`,
      );
      continue;
    }

    checkedFiles++;
    if (!normalizeWhitespace(file.contents).includes(normalizeWhitespace(source.quote))) {
      failures.push(
        `${label}\n    quote no longer found in ${source.file} (${source.section})\n` +
          `    quote: ${JSON.stringify(source.quote)}`,
      );
    }
  }

  if (failures.length > 0) {
    fail(
      `${failures.length} of ${found.length} facts are no longer backed by their cited source:\n\n` +
        failures.map((f) => `  ✗ ${f}`).join('\n\n') +
        '\n',
    );
  }

  console.log(`✓ facts: ${found.length} claims verified against ${checkedFiles} source file(s)`);

  // Docs: every snippet resolves to exactly one README block, and the rules the
  // site lists are exactly the rules the CLI explains.
  const { validateDocs } = await import(path.join(websiteRoot, 'lib/docs.ts'));
  let explained;
  try {
    explained = validateDocs();
  } catch (error) {
    fail(String(error instanceof Error ? error.message : error));
  }
  const listed = factsModule.rules.map((r) => r.id);
  const missingDocs = listed.filter((id) => !explained.includes(id));
  const unlisted = explained.filter((id) => !listed.includes(id));
  if (missingDocs.length || unlisted.length) {
    fail(
      'facts.rules and the CLI explanations disagree:\n' +
        (missingDocs.length ? `  no explanation for: ${missingDocs.join(', ')}\n` : '') +
        (unlisted.length ? `  explained but not in facts.rules: ${unlisted.join(', ')}\n` : ''),
    );
  }
  console.log(`✓ docs: snippets resolved, ${explained.length} rules match the CLI explanations`);
}

function fail(message) {
  console.error(`\n✗ check-facts failed\n${message}\n`);
  process.exit(1);
}

await main();
