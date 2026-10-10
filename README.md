# safe-install — website

The marketing site for **safe-install**, the open-source CLI that stops malicious npm /
pnpm / Yarn / bun install scripts before they run.

A landing page plus developer docs under `/docs/`, fully static, and it builds on its own:

```bash
safe-install install --frozen-lockfile   # dogfooding: no dependency of this site needs an install script
npm run build   # emits out/
```

Requires Node `>=24` (see `.nvmrc`) and [safe-install](https://github.com/crossben/safe-install#get-it): the site installs its own dependencies through the tool it documents. `npm ci --ignore-scripts` works too. The final image ships no Node.js at all.

---

## Develop

```bash
safe-install install --frozen-lockfile
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
| `npm run sync:sources` | Refresh the vendored plan and CLI snapshots (below).  |
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

### `content/sources/`

The product plan lives at the root of the parent workspace, which is **not committed**,
and the CLI is its own repository. A clean clone of this repo would have nothing to
verify against, so both are vendored here as pinned snapshots and claims cite _those_:

| Snapshot                                                    | Copied from                          | Cited for                                                 |
| ----------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| `plan.md`                                                   | `../plan.md`                         | design decisions, rule severities                         |
| `app/README.md`                                             | `../app/README.md`                   | every command shown, package-manager table, docs snippets |
| `app/explain.go`                                            | `../app/internal/analyze/explain.go` | the `/docs/rules/` reference                              |
| `app/root.go`                                               | `../app/internal/cli/root.go`        | exit codes                                                |
| `app/CHANGELOG.md`, `app/action.yml`, `app/goreleaser.yaml` | `../app/`                            | release facts                                             |

After the plan or the CLI changes:

```bash
npm run sync:sources     # copies the files above into content/sources/
npm run check:facts      # surfaces every claim the sources no longer support
```

Commit the refreshed snapshots in the same change that updates the affected facts. The
folder is in `.prettierignore` and is only ever copied, never edited by hand.

## The docs

`/docs/` pages are server components in `app/docs/`, sharing `components/docs/Docs.tsx`
(layout, sidebar, prose helpers). Prose lives in `content/en.ts` under `docs`. Code blocks
are never retyped: `scripts/doc-snippets.mjs` names, by a unique marker, the README code
block each snippet is, and `lib/docs.ts` extracts it verbatim. The rules page is generated
from `explain.go`, the same text as `safe-install explain`.

`check-facts` (so `predev` / `prebuild`) also fails when a snippet marker matches zero or
several README blocks, or when `facts.rules` and `explain.go` disagree on which rules exist.
