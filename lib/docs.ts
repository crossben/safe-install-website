/**
 * Build-time readers for the docs pages. Snippets are fenced blocks of the CLI
 * README, rule explanations come from the CLI's explain.go: both are vendored
 * snapshots under content/sources/ (`npm run sync:sources`). Nothing is retyped.
 *
 * Node built-ins and relative imports only: scripts/check-facts.mjs imports this
 * file directly (Node strips the types) to validate everything before a build.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DOC_SNIPPETS, EXPLAIN_FILE } from '../scripts/doc-snippets.mjs';

export type DocSnippetId = keyof typeof DOC_SNIPPETS;
export type DocLang = 'bash' | 'json' | 'yaml' | 'text';
export type DocSnippet = { code: string; lang: DocLang; source: string };
export type Explanation = { id: string; title: string; why: string; fix: string };

const root = () => process.cwd();
const cache = new Map<string, string>();

function read(file: string): string {
  let text = cache.get(file);
  if (text === undefined) {
    text = readFileSync(join(root(), file), 'utf8').replace(/\r\n/g, '\n');
    cache.set(file, text);
  }
  return text;
}

const LANGS: Record<string, DocLang> = { sh: 'bash', bash: 'bash', json: 'json', yaml: 'yaml' };

function codeBlocks(markdown: string): { code: string; lang: DocLang }[] {
  const blocks: { code: string; lang: DocLang }[] = [];
  for (const m of markdown.matchAll(/^```([\w-]*)\n([\s\S]*?)\n```/gm)) {
    blocks.push({ code: m[2] ?? '', lang: LANGS[m[1] ?? ''] ?? 'text' });
  }
  return blocks;
}

/** The README code block containing the snippet's marker (exactly one must). */
export function docSnippet(id: DocSnippetId): DocSnippet {
  const { file, marker } = DOC_SNIPPETS[id];
  const matches = codeBlocks(read(file)).filter((b) => b.code.includes(marker));
  const [match] = matches;
  if (matches.length !== 1 || !match) {
    throw new Error(
      `[docs] snippet "${id}": expected exactly one code block in ${file} containing ` +
        `${JSON.stringify(marker)}, found ${matches.length}. Update scripts/doc-snippets.mjs.`,
    );
  }
  return { ...match, source: file.replace('content/sources/app/', '') };
}

const goString = '"((?:[^"\\\\]|\\\\.)*)"';
const entryRe = new RegExp(
  `\\{${goString},\\s*${goString},\\s*${goString},\\s*${goString}\\}`,
  'g',
);

/** Every rule explanation from explain.go, in file order. */
export function explanations(): Explanation[] {
  const unquote = (s = '') => JSON.parse(`"${s}"`) as string;
  const out: Explanation[] = [];
  for (const m of read(EXPLAIN_FILE).matchAll(entryRe)) {
    out.push({ id: m[1] ?? '', title: unquote(m[2]), why: unquote(m[3]), fix: unquote(m[4]) });
  }
  if (out.length === 0) {
    throw new Error(`[docs] no rule explanations found in ${EXPLAIN_FILE}`);
  }
  return out;
}

/** Validates every snippet and returns the explained rule IDs (for check-facts). */
export function validateDocs(): string[] {
  for (const id of Object.keys(DOC_SNIPPETS) as DocSnippetId[]) docSnippet(id);
  return explanations().map((e) => e.id);
}
