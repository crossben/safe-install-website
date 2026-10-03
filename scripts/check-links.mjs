#!/usr/bin/env node
/**
 * Verifies the built site in `out/`.
 *
 * Two kinds of link are checked:
 *
 *  1. Internal — every `#anchor` must resolve to an `id` that exists in the
 *     document, and every internal path must exist in the export. These are
 *     always fatal: they are the links that actually break navigation, and
 *     they can be verified offline and instantly.
 *
 *  2. Outbound — every `http(s)` URL is fetched. This is fatal too, but it
 *     needs the network; pass `--skip-external` to check anchors only.
 *
 * Not part of `prebuild` on purpose: it needs a finished build and (by default)
 * the network, neither of which should be able to break a deploy for a
 * transient upstream hiccup. Run it in CI as its own step.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(scriptDir, '..');
const outDir = path.join(websiteRoot, 'out');

const skipExternal = process.argv.includes('--skip-external');
const IGNORED_SCHEMES = ['mailto:', 'tel:', 'data:', 'javascript:'];

/** Every `.html` file in the export, as paths relative to `out/`. */
async function collectHtmlFiles(dir, relative = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(path.join(dir, entry.name), relativePath)));
    } else if (entry.name.endsWith('.html')) {
      files.push(relativePath);
    }
  }
  return files;
}

/** Matches href/src targets in an already-minified HTML string. */
const ATTRIBUTE_PATTERN = /\b(?:href|src)\s*=\s*"([^"]*)"/g;

function extractLinks(html) {
  const links = [];
  for (const match of html.matchAll(ATTRIBUTE_PATTERN)) {
    links.push(match[1]);
  }
  return links;
}

function extractIds(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\bid\s*=\s*"([^"]*)"/g)) {
    ids.add(match[1]);
  }
  return ids;
}

/** Splits `pathname#hash` without a URL parser, for export-relative hrefs. */
function splitHref(href) {
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) return [href, ''];
  return [href.slice(0, hashIndex), href.slice(hashIndex)];
}

/**
 * Maps a link target to the exported file it should resolve to, as a path
 * relative to `out/`. With `trailingSlash: true`, `/ci/` is served by
 * `ci/index.html`, while `/_next/static/x.js` is served by the file itself.
 *
 * The query string is dropped: Next emits cache-busted metadata URLs such as
 * `/icon.svg?icon.0pfjdo7hb64y_.svg`, but the exported file is still
 * `icon.svg`.
 */
function resolveInternalPath(pathname) {
  const withoutQuery = pathname.split('?')[0];
  const decoded = decodeURIComponent(withoutQuery);
  if (decoded === '' || decoded === '/') return 'index.html';

  const trimmed = decoded.replace(/^\/+|\/+$/g, '');
  const direct = path.join(outDir, trimmed);

  // A direct hit is a real asset, not a page route.
  if (existsSync(direct) && !statSync(direct).isDirectory()) {
    return path.relative(outDir, direct);
  }

  return path.join(trimmed, 'index.html');
}

async function checkExternal(url) {
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': 'safe-install-link-check' },
    });
    // Some hosts (and GitHub's 404 page) reject HEAD; retry with a ranged GET.
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'user-agent': 'safe-install-link-check', range: 'bytes=0-0' },
      });
    }
    return response.ok ? null : `HTTP ${response.status}`;
  } catch (error) {
    return error.name === 'TimeoutError' ? 'timed out' : error.message;
  }
}

async function main() {
  if (!existsSync(outDir)) {
    console.error('✗ check-links: no out/ directory. Run `npm run build` first.');
    process.exit(1);
  }

  const htmlFiles = await collectHtmlFiles(outDir);
  const documents = new Map();

  for (const file of htmlFiles) {
    documents.set(file, await readFile(path.join(outDir, file), 'utf8'));
  }

  const failures = [];
  const externalUrls = new Set();
  let anchorCount = 0;

  // Ids per exported document, so an anchor can be validated against the page
  // it actually points at — `/#install` on the 404 page resolves against the
  // homepage, not against the 404 itself.
  const idsByDocument = new Map();
  for (const [file, html] of documents) {
    idsByDocument.set(file, extractIds(html));
  }

  for (const [file, html] of documents) {
    for (const href of extractLinks(html)) {
      if (href === '' || href.startsWith('#!')) continue;
      if (IGNORED_SCHEMES.some((scheme) => href.startsWith(scheme))) continue;

      if (/^https?:\/\//i.test(href)) {
        externalUrls.add(href.split('#')[0]);
        continue;
      }

      const [pathname, hash] = splitHref(href);

      // Resolve which exported document this link lands on.
      let targetDocument;
      if (pathname === '') {
        targetDocument = file; // same-document fragment
      } else if (pathname.startsWith('/')) {
        targetDocument = resolveInternalPath(pathname);
      } else {
        failures.push(`${file}: unhandled relative link ${href}`);
        continue;
      }

      if (!existsSync(path.join(outDir, targetDocument))) {
        failures.push(`${file}: ${href} → missing export ${targetDocument}`);
        continue;
      }

      if (hash) {
        anchorCount++;
        const ids = idsByDocument.get(targetDocument);
        if (!ids.has(decodeURIComponent(hash.slice(1)))) {
          failures.push(`${file}: ${href} → no id "${hash.slice(1)}" in ${targetDocument}`);
        }
      }
    }
  }

  let externalCount = 0;
  if (externalUrls.size > 0 && !skipExternal) {
    externalCount = externalUrls.size;
    const queue = [...externalUrls];

    // A handful of concurrent requests keeps this fast without hammering
    // anyone else's server.
    const CONCURRENCY = 6;
    const results = new Array(queue.length);

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async (_, workerIndex) => {
        for (let i = workerIndex; i < queue.length; i += CONCURRENCY) {
          const url = queue[i];
          results[i] = { url, error: await checkExternal(url) };
        }
      }),
    );

    for (const { url, error } of results) {
      if (error) failures.push(`outbound: ${url} → ${error}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\n✗ check-links: ${failures.length} problem(s)\n`);
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    console.error('');
    process.exit(1);
  }

  const outboundNote = skipExternal
    ? ' (outbound skipped — pass without --skip-external to check them)'
    : '';
  console.log(
    `✓ links: ${anchorCount} anchors, ${documents.size} pages, ${externalCount} outbound URLs${outboundNote}`,
  );
}

await main();
