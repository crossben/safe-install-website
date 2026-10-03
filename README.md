# safe-install — website

The marketing site for **safe-install**, the open-source CLI that stops malicious npm /
pnpm / Yarn / bun install scripts before they run.

It is a single page, fully static, and builds on its own:

```bash
npm ci
npm run build   # emits out/
```

Requires Node `>=24` (see `.nvmrc`). The final image ships no Node.js at all.

---

## Develop

```bash
npm ci
npm run dev      # http://localhost:3000
```

`predev` and `prebuild` both run `check-facts.mjs`, so a stale claim breaks the build
before you ever see it in the browser.

| Script                 | What it does                                          |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Dev server.                                           |
| `npm run build`        | Static export into `out/`.                            |
| `npm start`            | `npx serve out` to preview the export.                |
| `npm run lint`         | ESLint 9 flat config, `@next/eslint-plugin-next`.     |
| `npm run typecheck`    | `tsc --noEmit`.                                       |
| `npm run format`       | Prettier write. `format:check` verifies.              |
| `npm run check:facts`  | Every claim still matches its cited source.           |
| `npm run sync:sources` | Refresh the vendored plan snapshot (see below).       |
| `npm run check:links`  | Anchors, internal routes and outbound URLs in `out/`. |

`check:links` is deliberately **not** in `prebuild`: it needs a finished build and
network access, and a transient upstream outage should not block a deploy. Run it as
its own CI step, or `npm run check:links -- --skip-external` to check anchors offline.

---

## The facts system

This is a security tool's website, so it does not get to make things up.

`content/facts.ts` holds **every factual claim** on the site — rule IDs and severities,
supported package managers and their exact flags, CLI commands, exit codes, scoring
bands, monitor backends, the licence. Each one carries a `source` naming the plan
section and an **exact substring** of the file that backs it:

```ts
rule(
  'SI-INT-001',
  'integrity',
  'Lockfile integrity hash missing or mismatches registry',
  'block',
  '| SI-INT-001 | Lockfile integrity hash missing or mismatches registry | block |',
);
```

`scripts/check-facts.mjs` imports that module, walks every export for objects carrying a
source, and fails if a quote is no longer present in its file. Editing the plan without
updating the site produces a build error naming the exact claim, not a silently stale
paragraph.

It has already earned its keep: the plan was revised twice mid-build and both times it
caught renamed policy fields and a reworded rule before they reached the page.

### `content/sources/plan.md`

The product plan lives at the root of the parent workspace, which §5 of the plan itself
says is **not committed** ("Each is its own public git repo"). A clean clone of this repo
therefore has no plan to verify against, and `prebuild` would always fail.

So the plan is vendored here as a pinned snapshot and claims cite _that_. After editing
the plan upstream:

```bash
npm run sync:sources     # copies ../plan.md -> content/sources/plan.md
npm run check:facts      # surfaces every claim the plan no longer supports
```

Commit the refreshed snapshot in the same change that updates the affected facts.

Two rules for this file: it is listed in `.prettierignore` (Prettier rewrites `*x*` to
`_x_` and reflows tables, which would break every quoted line) and it is only ever
copied, never edited by hand.

When the Go CLI exists, repoint the `file` fields at the real sources — the rule files
under `internal/analyze/rules/`, the commands in `cmd/safe-install/`. Nothing else has
to change; the quotes will simply be checked against better evidence.

### `content/types.ts` and `content/en.ts`

All prose lives in `content/en.ts`, typed by `SiteContent` in `content/types.ts`.
Components never contain copy. Adding `content/fr.ts` later gets its spelling and its
omissions checked by the compiler rather than by someone reading French.

---

## Deploy

```bash
docker compose up --build     # serves on :3000
```

Three stages: `node:24-alpine` installs from the lockfile, builds the static export,
and a final `caddy:2-alpine` serves `out/` as `/srv`. No Node.js and no `node_modules`
reach the runtime image.

The `Caddyfile` sets zstd/gzip encoding, `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, strips `Server`, serves `/_next/static/*` as
immutable for a year, and routes everything else through `must-revalidate`. Unmatched
routes return a real `404` status via `{err.NOT_FOUND}` + `handle_errors`, rather than
a `200` carrying the error page.

TLS is not configured — put a reverse proxy in front, or replace `:3000` with a
hostname and let Caddy manage certificates.

---

## Design notes

- **One accent.** A hazard amber carries the brand; red is reserved for "this gets
  blocked" and is never decorative. Everything else is neutral.
- **Tokens flip in both directions.** Semantic CSS variables live in `:root` and `.dark`
  and are mapped through `@theme inline`, so one utility set works in either theme.
- **Code blocks are dark in both themes.** The light half of the Shiki palette does not
  clear AA against our surfaces, and a dark block keeps the terminal-native feel.
- **No flash.** A tiny inline script in `app/layout.tsx` applies the theme before first
  paint, wrapped in try/catch because `localStorage` throws in private browsing.
- **Motion is opt-out.** Everything animated goes through `gsap.matchMedia`, so
  `prefers-reduced-motion: reduce` skips the timelines and content still appears.
- **No third parties.** No analytics, no trackers, no external fonts at runtime —
  Inter and JetBrains Mono are self-hosted through `next/font`.

---

## Performance

Measured with Lighthouse 13.5.0 against the Caddy-served production build
(`docker compose up`, Chrome `--headless=new`):

| Preset  | Performance | Accessibility | Best practices | SEO |
| ------- | ----------- | ------------- | -------------- | --- |
| Desktop | 100         | 100           | 100            | 100 |
| Mobile  | 100\*       | 100           | 100            | 100 |

Desktop: LCP 0.7 s, TBT 0 ms, CLS 0.003.

\* Mobile **performance** is the one number that is not stable on this machine, and
the reason is not the site. The host is running an unrelated QEMU VM pinned at ~128%
CPU, and Lighthouse's simulated throttling multiplies whatever main-thread time it
observes. Across repeated runs mobile performance scored between 80 and 95 simulated
(TBT 100–480 ms), while the same build **unthrottled** scored 100 with LCP 0.2 s and
TBT 20 ms. The page itself is light: 195 KB of JS and 88 KB of fonts across 14
requests, no third-party code, self-hosted fonts, no analytics.

Two tunings landed along the way that help regardless: the hero terminal caps its
typing run at 3.5 s and commits at ~30 fps instead of 60, and code blocks use a
single Shiki theme instead of emitting both light and dark tokens.

---

## Known deviations

- **Rule families are six, not five.** The brief suggested Scripts / Recency /
  Popularity / Integrity / Vulns. `SI-DEP-001` (deprecated or unpublished) fits none of
  them honestly, so it gets its own "Is this package still maintained?" group rather
  than being mis-filed.
- **`npm audit` reports 10 high-severity advisories, all dev-only.** They come from
  `braces` via `micromatch` → `fast-glob` in `@next/eslint-plugin-next` and
  `typescript-eslint` — lint tooling that never ships. `braces@3.0.3` is already the
  latest release and is still flagged, so there is no upstream fix; `npm audit fix
--force` would resolve it by downgrading `@next/eslint-plugin-next` to 14.x, which we
  are not doing. `npm audit --omit=dev` reports **0 vulnerabilities**.
- **The hero terminal output is illustrative.** The shape, rule IDs, commands and
  wording are real; `dotenv-helper@4.2.1` and its numbers are a worked example. The
  page says so directly beneath it.
- **Install commands are conventional forms.** The plan commits to shipping a Homebrew
  tap, a Scoop bucket and `.deb`/`.rpm` (M8, §3), but does not spell out the exact
  lines, so `content/facts.ts` holds editable placeholders for them.
