import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The guide `safe-install llm` prints, vendored from the CLI (`npm run sync:sources`). */
export const AGENTS_GUIDE_FILE = 'content/sources/app/llm.md';

export function agentsGuide(): string {
  return readFileSync(join(process.cwd(), AGENTS_GUIDE_FILE), 'utf8').replace(/\r\n/g, '\n');
}
