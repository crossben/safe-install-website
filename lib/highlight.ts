import { createHighlighter, type Highlighter } from 'shiki';
import type { CodeLang } from '@/content/types';

/**
 * Build-time syntax highlighting.
 *
 * Everything renders during `next build` (the site is a static export), so the
 * highlighter is created once per build and memoised. Nothing here runs in the
 * browser and no highlighting library ships to the client.
 *
 * Code blocks are dark in both themes (the light palette does not clear AA
 * against our surfaces), so only one Shiki theme is loaded and the emitted
 * markup carries no redundant per-theme variables.
 */

const LANGS = ['bash', 'powershell', 'json', 'yaml', 'text'] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['vitesse-dark'],
    langs: [...LANGS],
  });
  return highlighterPromise;
}

/** Memoised on the pair, so a snippet reused across sections highlights once. */
const cache = new Map<string, string>();

export async function highlight(code: string, lang: CodeLang): Promise<string> {
  const key = `${lang}::${code}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const highlighter = await getHighlighter();
  const html = highlighter.codeToHtml(code, { lang, theme: 'vitesse-dark' });

  cache.set(key, html);
  return html;
}
