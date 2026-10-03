import { createHighlighter, type Highlighter } from 'shiki';
import type { CodeLang } from '@/content/types';

/**
 * Build-time syntax highlighting.
 *
 * Everything renders during `next build` (the site is a static export), so the
 * highlighter is created once per build and memoised. Nothing here runs in the
 * browser and no highlighting library ships to the client.
 *
 * Shiki emits both themes as CSS custom properties (`--shiki-light` /
 * `--shiki-dark`); `app/globals.css` picks the right one, which means one
 * server-rendered string serves light and dark with no duplicated markup and no
 * theme flash on toggle.
 */

const LANGS = ['bash', 'powershell', 'json', 'yaml', 'text'] as const;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: ['vitesse-light', 'vitesse-dark'],
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
  const html = highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
    defaultColor: false,
  });

  cache.set(key, html);
  return html;
}