/**
 * Every factual claim the site makes, with the exact text that backs it.
 *
 * `scripts/check-facts.mjs` (wired into `predev` / `prebuild`) imports this
 * module, walks it for anything shaped like a `Fact`, and fails the build if a
 * cited `quote` no longer appears in the cited `file`.
 *
 * Sources are snapshots under `content/sources/` (refresh with
 * `npm run sync:sources`):
 *   - `app/…`  files from the CLI repository: anything a user can run or rely on
 *              (commands, exit codes, package-manager behaviour) cites these;
 *   - `plan.md` the product plan: design decisions and rule severities.
 *
 * Copy is NOT here. Prose lives in `content/en.ts`.
 */

export type FactSource = {
  /** Human label for the section of the source that backs the claim. */
  readonly section: string;
  /** Path to the backing file, relative to `website/`. */
  readonly file: string;
  /** An exact substring of `file`. The build fails if this stops matching. */
  readonly quote: string;
};

export type Fact<T> = {
  readonly value: T;
  readonly source: FactSource;
};

export function fact<T>(value: T, source: FactSource): Fact<T> {
  return { value, source };
}

/**
 * Claims cite a snapshot of the product plan that lives inside this repo.
 *
 * The plan itself lives at the root of the (uncommitted) parent workspace, so a
 * clean clone of this repo would have nothing to verify against and `prebuild`
 * would always fail. `content/sources/plan.md` is that snapshot: refresh it with
 * `npm run sync:sources` after editing the plan.
 */
const PLAN = 'content/sources/plan.md' as const;
/** The CLI repository's README: install commands, usage, package-manager table. */
const README = 'content/sources/app/README.md' as const;
/** The CLI's exit codes. */
const ROOT_GO = 'content/sources/app/root.go' as const;

/** A fact whose value is quoted verbatim from its source (commands, code). */
function verbatim(text: string, section: string, file: string = README): Fact<string> {
  return fact(text, { section, file, quote: text });
}

/** Severity as the plan describes it. `block` means always-block regardless of score. */
export type Severity = 'low' | 'medium' | 'high' | 'block' | 'advisory';

export type RuleFamily =
  | 'scripts'
  | 'recency'
  | 'popularity'
  | 'integrity'
  | 'maintenance'
  | 'policy'
  | 'vulns'
  | 'code'
  | 'monitor';

export type Rule = {
  readonly id: string;
  readonly family: RuleFamily;
  /** The plan's own wording for what the rule detects. */
  readonly signal: string;
  readonly severity: Severity;
  readonly source: FactSource;
};

export type PackageManager = {
  readonly id: 'npm' | 'pnpm' | 'yarn-classic' | 'yarn-berry' | 'bun';
  readonly name: string;
  readonly lockfile: string;
  readonly disableScripts: string;
  readonly runApproved: string;
  readonly source: FactSource;
};

export type CliCommand = {
  readonly usage: string;
  /** The plan's own comment describing the command. */
  readonly summary: string;
  readonly source: FactSource;
};

/* -------------------------------------------------------------------------- */
/* Identity                                                                    */
/* -------------------------------------------------------------------------- */

export const license = fact('Apache-2.0', {
  section: 'Header',
  file: PLAN,
  quote: 'Go · Apache-2.0 · Linux / macOS / Windows',
});

export const platforms = fact(['Linux', 'macOS', 'Windows'] as const, {
  section: 'Header',
  file: PLAN,
  quote: 'Go · Apache-2.0 · Linux / macOS / Windows',
});

export const language = fact('Go 1.25+', {
  section: '§3 Stack',
  file: PLAN,
  quote: '| Language | **Go 1.25+** |',
});

/** Go module path — also the GitHub repository location. */
export const repo = fact('github.com/crossben/safe-install', {
  section: '§5 Architecture',
  file: PLAN,
  quote: 'Module path:\n`github.com/crossben/safe-install`.',
});

export const repoLayout = fact('the Go CLI lives in `app/` and the website in `website/`', {
  section: '§5 Architecture',
  file: PLAN,
  quote: 'the Go CLI lives in `app/` and the website in `website/`. Each is its own',
});

export const goRationale = fact(
  'Static single binary per OS/arch, trivial cross-compile, fast concurrent HTTP, mature security-tooling ecosystem (osv-scanner, trivy, grype are Go).',
  {
    section: '§3 Stack — Language row',
    file: PLAN,
    quote:
      'Static single binary per OS/arch, trivial cross-compile, fast concurrent HTTP, mature security-tooling ecosystem (osv-scanner, trivy, grype are Go).',
  },
);

export const releaseTargets = fact('linux/darwin/windows × amd64/arm64', {
  section: '§3 Stack — Release row',
  file: PLAN,
  quote: 'Builds linux/darwin/windows × amd64/arm64;',
});

export const releaseIntegrity = fact(
  ['cosign signatures', 'SLSA provenance', 'reproducible builds (-trimpath)'] as const,
  {
    section: '§3 Stack — Release row; §12 Repo hygiene',
    file: PLAN,
    quote: '**cosign signatures + SLSA provenance**',
  },
);

export const reproducibleBuilds = fact('-trimpath', {
  section: '§12 Repo hygiene',
  file: PLAN,
  quote: 'reproducible builds (`-trimpath`)',
});

export const notDistributedViaNpm = fact(
  'a supply-chain security tool installed through the channel it protects is a weak story',
  {
    section: '§3 Stack (after the table)',
    file: PLAN,
    quote:
      'a supply-chain security tool\ninstalled through the channel it protects is a weak story.',
  },
);

/* -------------------------------------------------------------------------- */
/* Behaviour                                                                   */
/* -------------------------------------------------------------------------- */

export const dropIn = fact('npm install / pnpm install / yarn / bun install', {
  section: '§1 Success criteria',
  file: PLAN,
  quote: 'in place of `npm install` / `pnpm install` / `yarn` / `bun install`.',
});

export const coversWholeTree = fact(true, {
  section: '§1 Success criteria',
  file: PLAN,
  quote: 'Covers the **whole dependency tree** from the lockfile, not just `package.json`.',
});

export const lifecycleScripts = fact(['preinstall', 'install', 'postinstall'] as const, {
  section: '§1 Why',
  file: PLAN,
  quote: '**lifecycle scripts**\n(`preinstall`, `install`, `postinstall`).',
});

export const coreIdea = fact(
  'Downloading and extracting tarballs is safe; executing scripts is not.',
  {
    section: '§2 Core idea',
    file: PLAN,
    quote: 'Downloading and extracting tarballs is safe; executing scripts is not.',
  },
);

/** The five steps of §2, verbatim. */
export const workflowSteps = fact(
  [
    {
      id: 'analyze',
      label: 'Analyze',
      detail: 'lockfile → full tree → registry metadata → risk score per package',
    },
    {
      id: 'install',
      label: 'Install',
      detail: 'package manager with ALL lifecycle scripts disabled',
    },
    {
      id: 'inspect',
      label: 'Inspect',
      detail: 'list every package that wants to run a script; show + flag the script',
    },
    {
      id: 'approve',
      label: 'Approve',
      detail: 'user (or policy file) approves per package@version',
    },
    {
      id: 'run',
      label: 'Run',
      detail: 'execute approved scripts only   [Linux: optionally under the runtime monitor]',
    },
  ] as const,
  {
    section: '§2 Core idea',
    file: PLAN,
    quote: '1. Analyze   lockfile → full tree → registry metadata → risk score per package',
  },
);

/* -------------------------------------------------------------------------- */
/* §4 Package managers                                                         */
/* -------------------------------------------------------------------------- */

function pm(
  id: PackageManager['id'],
  name: string,
  lockfile: string,
  disableScripts: string,
  runApproved: string,
  quote: string,
): PackageManager {
  return {
    id,
    name,
    lockfile,
    disableScripts,
    runApproved,
    source: { section: 'README — Supported package managers', file: README, quote },
  };
}

const RUN_IN_DIR = 'npm run <stage> --ignore-scripts in the package directory';

export const packageManagers: readonly PackageManager[] = [
  pm(
    'npm',
    'npm',
    'package-lock.json (v2/v3)',
    'npm install --ignore-scripts',
    RUN_IN_DIR,
    '| npm | `package-lock.json` (v2/v3) | `npm install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |',
  ),
  pm(
    'pnpm',
    'pnpm',
    'pnpm-lock.yaml (v6, v9)',
    'pnpm install --ignore-scripts',
    RUN_IN_DIR,
    '| pnpm | `pnpm-lock.yaml` (v6, v9) | `pnpm install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |',
  ),
  pm(
    'yarn-classic',
    'Yarn classic',
    'yarn.lock (v1)',
    'yarn install --ignore-scripts',
    RUN_IN_DIR,
    '| Yarn classic | `yarn.lock` (v1) | `yarn install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |',
  ),
  pm(
    'yarn-berry',
    'Yarn berry',
    'yarn.lock (v2+)',
    'yarn install --mode=skip-build',
    'npm run <stage> --ignore-scripts in .yarn/unplugged, with .pnp.cjs preloaded',
    '| Yarn berry | `yarn.lock` (v2+) | `yarn install --mode=skip-build` | `npm run <stage> --ignore-scripts` in `.yarn/unplugged`, with `.pnp.cjs` preloaded |',
  ),
  pm(
    'bun',
    'bun',
    'bun.lock',
    'bun install --ignore-scripts',
    RUN_IN_DIR,
    '| bun | `bun.lock` | `bun install --ignore-scripts` | `npm run <stage> --ignore-scripts` in the package directory |',
  ),
];

export const corepackPinned = fact(true, {
  section: 'README — Supported package managers',
  file: README,
  quote: 'When `packageManager` pins pnpm or Yarn,\nsafe-install runs it through corepack',
});

export const pmDetectionOrder = fact(
  ['lockfile', 'packageManager field in package.json', '--pm overrides both'] as const,
  {
    section: 'README — Supported package managers',
    file: README,
    quote:
      'The package manager is detected from the lockfile, then the `packageManager` field in\n`package.json` (`--pm` overrides both).',
  },
);

/* -------------------------------------------------------------------------- */
/* §6 Risk rules                                                               */
/* -------------------------------------------------------------------------- */

function rule(
  id: string,
  family: RuleFamily,
  signal: string,
  severity: Severity,
  quote: string,
): Rule {
  return {
    id,
    family,
    signal,
    severity,
    source: { section: `§6 Risk rules (${id})`, file: PLAN, quote },
  };
}

export const rules: readonly Rule[] = [
  rule(
    'SI-SCR-001',
    'scripts',
    'Has `preinstall` / `install` / `postinstall`',
    'medium',
    '| SI-SCR-001 | Has `preinstall` / `install` / `postinstall` | medium |',
  ),
  rule(
    'SI-SCR-002',
    'scripts',
    'Script downloads + executes (`curl … | sh`, `wget … | bash`, `iwr … | iex`, encoded PowerShell)',
    'block',
    '| SI-SCR-002 | Script downloads + executes (`curl … \\| sh`, `wget … \\| bash`, `iwr … \\| iex`, encoded PowerShell) | block |',
  ),
  rule(
    'SI-SCR-003',
    'scripts',
    'Script (or the file it runs) uses `eval` / `new Function`, or contains a long base64 / hex blob',
    'high',
    '| SI-SCR-003 | Script (or the file it runs) uses `eval` / `new Function`, or contains a long base64 / hex blob | high |',
  ),
  rule(
    'SI-SCR-004',
    'scripts',
    'Script (or the file it runs) references credentials (`~/.ssh`, `~/.npmrc`, `~/.aws`, `.git-credentials`, browser profiles, `NPM_TOKEN`…)',
    'high',
    '| SI-SCR-004 | Script (or the file it runs) references credentials (`~/.ssh`, `~/.npmrc`, `~/.aws`, `.git-credentials`, browser profiles, `NPM_TOKEN`…) | high |',
  ),
  rule(
    'SI-SCR-005',
    'scripts',
    'Script changed vs. the previously approved version',
    'high',
    '| SI-SCR-005 | Script changed vs. the previously approved version | high (re-approval) |',
  ),
  rule(
    'SI-REC-001',
    'recency',
    'Version published more recently than `minReleaseAge` (default 72h) and not held back (see §7a)',
    'medium',
    '| SI-REC-001 | Version published more recently than `minReleaseAge` (default 72h) and not held back (see §7a) | medium |',
  ),
  rule(
    'SI-REC-002',
    'recency',
    'Recent release (≤90d) that dropped provenance vs. the previous version, or was published by a never-seen human publisher (trusted publishing exempt) → high; maintainers added → low',
    'high',
    '| SI-REC-002 | Recent release (≤90d) that dropped provenance vs. the previous version, or was published by a never-seen human publisher (trusted publishing exempt) → high; maintainers added → low | high / low |',
  ),
  rule(
    'SI-POP-001',
    'popularity',
    'Name one edit (or only case/separators) away from a top-1000 package, and not itself in the ~16k popular list',
    'high',
    '| SI-POP-001 | Name one edit (or only case/separators) away from a top-1000 package, and not itself in the ~16k popular list | high |',
  ),
  rule(
    'SI-POP-002',
    'popularity',
    '< 1000 weekly downloads + install script (counts fetched only for such packages)',
    'medium',
    '| SI-POP-002 | < 1000 weekly downloads + install script (counts fetched only for such packages) | medium |',
  ),
  rule(
    'SI-INT-001',
    'integrity',
    'Lockfile integrity hash mismatches the registry (same algorithm)',
    'block',
    '| SI-INT-001 | Lockfile integrity hash mismatches the registry (same algorithm) | block |',
  ),
  rule(
    'SI-INT-002',
    'integrity',
    'Resolved URL not on the configured registry',
    'high',
    '| SI-INT-002 | Resolved URL not on the configured registry | high |',
  ),
  rule(
    'SI-DEP-001',
    'maintenance',
    'Package is deprecated / unpublished version',
    'low',
    '| SI-DEP-001 | Package is deprecated / unpublished version | low |',
  ),
  rule(
    'SI-POL-001',
    'policy',
    'Package matches a `blockPackages` glob (organization or project policy)',
    'block',
    '| SI-POL-001 | Package matches a `blockPackages` glob (organization or project policy) | block |',
  ),
  rule(
    'SI-VUL-001',
    'vulns',
    'OSV: `MAL-*` malicious package → block; advisories one level below their severity (critical→high, high→medium, else low)',
    'advisory',
    '| SI-VUL-001 | OSV: `MAL-*` malicious package → block; advisories one level below their severity (critical→high, high→medium, else low) | block / per advisory |',
  ),
  rule(
    'SI-CODE-001',
    'code',
    'Package code (not a script) downloads and executes: exec/spawn of a downloader, or eval/Function within 400 bytes after a network call',
    'high',
    '| SI-CODE-001 | Package code (not a script) downloads and executes: exec/spawn of a downloader, or eval/Function within 400 bytes after a network call | high |',
  ),
  rule(
    'SI-CODE-002',
    'code',
    'Package code reads credentials within 1500 bytes of a network send',
    'high',
    '| SI-CODE-002 | Package code reads credentials within 1500 bytes of a network send | high |',
  ),
  rule(
    'SI-CODE-003',
    'code',
    'Package code is obfuscated (≥100 `_0x…` names) or evals a ≥4 KB encoded blob',
    'medium',
    '| SI-CODE-003 | Package code is obfuscated (≥100 `_0x…` names) or evals a ≥4 KB encoded blob | medium |',
  ),
  rule(
    'SI-MON-001',
    'monitor',
    'Runtime monitor: script connected to the network (DNS ignored)',
    'medium',
    '| SI-MON-001 | Runtime monitor: script connected to the network (DNS ignored) | medium |',
  ),
  rule(
    'SI-MON-002',
    'monitor',
    'Runtime monitor: script ran a network tool (curl, wget, nc, ssh…)',
    'medium',
    '| SI-MON-002 | Runtime monitor: script ran a network tool (curl, wget, nc, ssh…) | medium |',
  ),
  rule(
    'SI-MON-003',
    'monitor',
    'Runtime monitor: script read credentials (`~/.ssh`, `~/.npmrc`, cloud, browser data)',
    'high',
    '| SI-MON-003 | Runtime monitor: script read credentials (`~/.ssh`, `~/.npmrc`, cloud, browser data) | high |',
  ),
  rule(
    'SI-MON-004',
    'monitor',
    'Runtime monitor: script wrote to a persistence location (shell rc, `~/.ssh`, autostart, systemd, git hooks, system dirs)',
    'high',
    '| SI-MON-004 | Runtime monitor: script wrote to a persistence location (shell rc, `~/.ssh`, autostart, systemd, git hooks, system dirs) | high |',
  ),
  rule(
    'SI-MON-005',
    'monitor',
    'Runtime monitor: script wrote outside the project and caches',
    'medium',
    '| SI-MON-005 | Runtime monitor: script wrote outside the project and caches | medium |',
  ),
];

export const scoring = fact(
  { cap: 100, low: '< 30', medium: '30–59', high: '≥ 60' },
  {
    section: '§6 Risk rules',
    file: PLAN,
    quote: 'capped at 100; levels: `low <30`, `medium 30–59`, `high ≥60`',
  },
);

export const alwaysBlock = fact(true, {
  section: '§6 Risk rules',
  file: PLAN,
  quote: 'plus some rules are\n**always-block** regardless of score.',
});

export const explainability = fact('every warning says why (rule + evidence)', {
  section: '§1 Success criteria',
  file: PLAN,
  quote: 'Explainable: every warning says *why* (rule + evidence).',
});

export const lowNoiseGoal = fact("popular, long-lived packages with known-good scripts don't nag", {
  section: '§1 Success criteria',
  file: PLAN,
  quote: "Low noise: popular, long-lived packages with known-good scripts don't nag.",
});

/* -------------------------------------------------------------------------- */
/* §7 Policy & trust                                                           */
/* -------------------------------------------------------------------------- */

export const globalPolicyPath = fact('$XDG_CONFIG_HOME/safe-install/config.json', {
  section: '§7 Policy & trust',
  file: PLAN,
  quote: '`$XDG_CONFIG_HOME/safe-install/config.json` (via `os.UserConfigDir`, so',
});

export const globalPolicyPathNote = fact(
  'os.UserConfigDir, so %AppData% on Windows, ~/Library/Application Support on macOS',
  {
    section: '§7 Policy & trust',
    file: PLAN,
    quote: '`%AppData%` on Windows, `~/Library/Application Support` on macOS).',
  },
);

export const projectPolicyFile = fact('.safe-install.json', {
  section: '§7 Policy & trust',
  file: PLAN,
  quote: '**Project**: `.safe-install.json` committed to the repo, so teams share approvals:',
});

export const defaultMinReleaseAge = fact('72h', {
  section: '§7 Policy & trust (example policy file)',
  file: PLAN,
  quote: '"minReleaseAge": "72h",',
});

export const minReleaseAgeExclude = fact('["typescript", "@types/*"]', {
  section: '§7 Policy & trust (example policy file); §7a Release-age gate',
  file: PLAN,
  quote: '"minReleaseAgeExclude": ["typescript", "@types/*"],',
});

export const defaultFailOn = fact('high', {
  section: '§7 Policy & trust (example policy file)',
  file: PLAN,
  quote: '"failOn": "high"',
});

export const approvalsPinScriptHash = fact(true, {
  section: '§7 Policy & trust',
  file: PLAN,
  quote: 'Approvals pin to the **script content hash**, so a changed script needs re-approval',
});

/* -------------------------------------------------------------------------- */
/* §7a Release-age gate                                                        */
/* -------------------------------------------------------------------------- */

export const releaseAgeGate = fact(
  'resolve to the newest version that is at least minReleaseAge old',
  {
    section: '§7a Release-age gate',
    file: PLAN,
    quote:
      '**resolve to the newest version that is at least `minReleaseAge` old**,\nso a freshly compromised release never lands.',
  },
);

export const releaseAgeGateInspiredBy = fact('https://github.com/kevinslin/safe-npm (ISC)', {
  section: '§7a Release-age gate',
  file: PLAN,
  quote: 'Inspired by [safe-npm](https://github.com/kevinslin/safe-npm) (ISC):',
});

export const releaseAgeNativeSettings = fact(
  'npm --before · pnpm minimumReleaseAge · Yarn berry npmMinimalAgeGate · bun --minimum-release-age',
  {
    section: '§13 Decisions — Yarn classic',
    file: PLAN,
    quote:
      '**Yarn classic** has no native release-age setting: `install` says so; `check` still flags.',
  },
);

export const releaseAgeInstallAndCheck = fact(true, {
  section: 'README — GitHub Action / release age',
  file: README,
  quote:
    '`install`\npasses this to the package manager so fresh releases are not picked up, and `check`\nflags any already in the lockfile.',
});

export const releaseAgeExcludeFindingsOnly = fact(true, {
  section: '§13 Decisions — minReleaseAgeExclude',
  file: PLAN,
  quote:
    '**`minReleaseAgeExclude`** applies to findings only; the age given to the package manager',
});

export const releaseAgeFallback = fact(
  'resolves direct dependencies itself (semver range ∩ age cutoff, newest wins) and pins them',
  {
    section: '§7a Release-age gate — Fallback',
    file: PLAN,
    quote:
      'safe-install resolves direct dependencies itself\n  (semver range ∩ age cutoff, newest wins) and pins them',
  },
);

export const releaseAgeOverrideFlag = fact('--min-age', {
  section: '§7a Release-age gate; §8 CLI surface',
  file: PLAN,
  quote:
    '`minReleaseAgeExclude` (glob list) bypasses the gate for trusted fast movers; `--min-age`',
});

export const examplePolicy = fact(
  {
    allowScripts: {
      'esbuild@0.25.x': 'approved',
      sharp: { approvedHash: 'sha256-…', by: 'ben', at: '2026-10-03' },
    },
    minReleaseAge: '72h',
    minReleaseAgeExclude: ['typescript', '@types/*'],
    failOn: 'high',
  },
  {
    section: '§7 Policy & trust (example policy file)',
    file: PLAN,
    quote: '"esbuild@0.25.x": "approved",',
  },
);

/* -------------------------------------------------------------------------- */
/* §8 CLI surface                                                              */
/* -------------------------------------------------------------------------- */

function cmd(usage: string, summary: string, quote: string): CliCommand {
  return { usage, summary, source: { section: '§8 CLI surface', file: PLAN, quote } };
}

export const commands: readonly CliCommand[] = [
  cmd(
    'safe-install',
    'detect PM, analyze, install safely (interactive)',
    'safe-install                     # detect PM, analyze, install safely (interactive)',
  ),
  cmd(
    'safe-install add <pkg>[@ver]',
    'analyze one package before adding it',
    'safe-install add <pkg>[@ver]     # analyze one package before adding it',
  ),
  cmd(
    'safe-install check',
    'analyze only, no install (CI: exit 1 on policy fail)',
    'safe-install check               # analyze only, no install (CI: exit 1 on policy fail)',
  ),
  cmd(
    'safe-install scripts',
    'list packages wanting scripts + approval state',
    'safe-install scripts             # list packages wanting scripts + approval state',
  ),
  cmd(
    'safe-install approve <pkg>',
    'approve / --revoke',
    'safe-install approve <pkg>       # approve / --revoke',
  ),
  cmd(
    'safe-install explain <rule-id>',
    'why a rule exists, how to resolve',
    'safe-install explain <rule-id>   # why a rule exists, how to resolve',
  ),
  cmd(
    'safe-install install --monitor',
    'Linux: run approved scripts under runtime monitor',
    'safe-install install --monitor   # Linux: run approved scripts under runtime monitor',
  ),
  cmd(
    'safe-install shell-init <bash|zsh|fish|pwsh>',
    'opt-in: prints aliases for you to add yourself',
    '`safe-install shell-init <bash|zsh|fish|pwsh>` prints',
  ),
];

export const shellInitNeverModifiesRc = fact(true, {
  section: '§13 Decisions — Shell alias',
  file: PLAN,
  quote: 'Never modifies rc files on its own (M5).',
});

export const yarnBerryPnp = fact('supported', {
  section: '§13 Decisions — Yarn berry PnP',
  file: PLAN,
  quote: '**Yarn berry PnP**: supported (verified in M4).',
});

export const globalFlags = fact(
  [
    '--pm',
    '--yes',
    '--ci',
    '--format=text|json|sarif',
    '--offline',
    '--registry',
    '--min-age',
  ] as const,
  {
    section: '§8 CLI surface',
    file: PLAN,
    quote: 'Global flags: --pm, --yes, --ci, --format=text|json|sarif, --offline, --registry',
  },
);

export const exitCodes = fact(
  [
    { code: 0, name: 'ok', description: 'Nothing reached your threshold.' },
    {
      code: 1,
      name: 'policy failure',
      description:
        'A package reached --fail-on; with --ci, also an unapproved high-risk script or a high-risk runtime-monitor finding.',
    },
    {
      code: 3,
      name: 'tool error',
      description:
        'safe-install could not do its job, for example registry metadata it could not fetch.',
    },
  ],
  {
    section: 'internal/cli/root.go — exit codes',
    file: ROOT_GO,
    quote: 'ExitOK            = 0\n\tExitPolicyFailure = 1',
  },
);

export const exitCodesReadme = fact('0 ok · 1 policy failure · 3 tool error', {
  section: 'README — Check without installing',
  file: README,
  quote: 'Exit codes: `0` ok · `1` a package reached `--fail-on`',
});

/* -------------------------------------------------------------------------- */
/* §9 Linux runtime monitor                                                    */
/* -------------------------------------------------------------------------- */

export const monitorLinuxOnly = fact(true, {
  section: '§9 Linux-only: runtime monitor',
  file: PLAN,
  quote: 'Not available on macOS/Windows: the CLI says so\nplainly.',
});

export const monitorBackend = fact('strace', {
  section: '§3 Stack — Linux monitor row',
  file: PLAN,
  quote: '| Linux monitor | `strace` (eBPF deferred until after v1, see §13) |',
});

export const monitorScope = fact(
  'strace -f on the script only (safe-install is npm’s --script-shell)',
  {
    section: '§9 Linux-only: runtime monitor — Backend',
    file: PLAN,
    quote:
      "**Backend**: `strace -f` on the script only (safe-install is passed as npm's\n  `--script-shell`)",
  },
);

export const monitorSignals: readonly string[] = [
  'Network connections (DNS lookups are ignored)',
  'Network tools: curl, wget, nc, ssh and similar',
  'Reads of credentials: ~/.ssh, ~/.npmrc, cloud and browser data',
  'Writes to persistence locations: shell startup files, ~/.ssh, autostart, systemd, git hooks, system directories',
  'Writes outside the project and package caches',
];

export const monitorSignalsFact = fact(monitorSignals, {
  section: 'README — Runtime monitor (Linux)',
  file: README,
  quote: 'safe-install reports network connections, network tools (`curl`, `wget`, `nc`…),',
});

export const monitorAfterTheFact = fact(true, {
  section: 'README — Runtime monitor (Linux)',
  file: README,
  quote:
    'strace sees a syscall once it happened, so `kill` stops\nthe script *after* the first dangerous action, not before it.',
});

export const monitorKill = verbatim(
  'safe-install install --monitor=kill',
  'README — Runtime monitor (Linux)',
);

export const monitorDefaultAction = verbatim(
  'safe-install install --monitor',
  'README — Runtime monitor (Linux)',
);

/* -------------------------------------------------------------------------- */
/* §12/§13 Guarantees                                                          */
/* -------------------------------------------------------------------------- */

export const telemetry = fact('none, ever', {
  section: '§13 Decisions',
  file: PLAN,
  quote: '**Telemetry**: none, ever. Stated in README and on the website.',
});

export const nonGoals: readonly string[] = [
  'Malware detection by content scanning of whole packages',
  'Ecosystems other than JavaScript',
  'Runtime monitoring on macOS / Windows',
];

export const nonGoalsFact = fact(nonGoals, {
  section: '§1 Non-goals (v1)',
  file: PLAN,
  quote: 'Ecosystems other than JavaScript (pip, cargo… later, behind the same interfaces).',
});

/* -------------------------------------------------------------------------- */
/* Distribution (inferred from §3/§10/§12)                                     */
/* -------------------------------------------------------------------------- */

/** Install commands, verbatim from the README. */
export const distribution = {
  brewTap: verbatim(
    'brew tap crossben/safe-install https://github.com/crossben/safe-install',
    'README — Get it',
  ),
  brewInstall: verbatim('brew install --cask safe-install', 'README — Get it'),
  scoopBucket: verbatim(
    'scoop bucket add safe-install https://github.com/crossben/safe-install',
    'README — Get it',
  ),
  scoopInstall: verbatim('scoop install safe-install', 'README — Get it'),
  deb: verbatim('sudo apt install ./safe-install_*_linux_amd64.deb', 'README — Get it'),
  goInstall: verbatim(
    'go install github.com/crossben/safe-install/cmd/safe-install@latest',
    'README — Get it',
  ),
  verify: verbatim(
    `cosign verify-blob checksums.txt \\
  --bundle checksums.txt.sigstore.json \\
  --certificate-identity-regexp '^https://github.com/crossben/safe-install/\\.github/workflows/release\\.yml@refs/tags/v' \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
sha256sum --ignore-missing -c checksums.txt

gh attestation verify safe-install_linux_amd64.tar.gz --repo crossben/safe-install`,
    'README — Verify a download',
  ),
  action: verbatim(
    `- uses: crossben/safe-install@v0.2.2
  with:
    working-directory: .   # where package.json and the lockfile are
    fail-on: high          # low, medium, high, block, none
    sarif: true            # upload to code scanning (needs security-events: write)
    comment: true          # comment on the PR (needs pull-requests: write)`,
    'README — GitHub Action',
  ),
  quarantine: fact(true, {
    section: 'README — Get it',
    file: README,
    quote: 'On macOS, Homebrew keeps the quarantine flag on the (not yet notarized) binary',
  }),
} as const;

export const agentsCommand = fact('safe-install llm >> AGENTS.md', {
  section: 'README — AI coding agents',
  file: README,
  quote: 'safe-install llm >> AGENTS.md',
});
