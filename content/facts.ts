/**
 * Every factual claim the site makes, with the exact text in `../plan.md`
 * that backs it.
 *
 * `scripts/check-facts.mjs` (wired into `predev` / `prebuild`) imports this
 * module, walks it for anything shaped like a `Fact`, and fails the build if a
 * cited `quote` no longer appears in the cited `file`. If `plan.md` changes,
 * the build breaks until these claims are either updated or removed.
 *
 * Once the Go repository exists, repoint `file` at the real sources (the rule
 * files under `internal/analyze/rules/`, the CLI definitions in
 * `cmd/safe-install/`, and so on) without changing anything else.
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

/** Severity as the plan describes it. `block` means always-block regardless of score. */
export type Severity = 'low' | 'medium' | 'high' | 'block' | 'advisory';

export type RuleFamily =
  'scripts' | 'recency' | 'popularity' | 'integrity' | 'maintenance' | 'vulns';

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

export const packageManagers: readonly PackageManager[] = [
  {
    id: 'npm',
    name: 'npm',
    lockfile: 'package-lock.json (v2/v3)',
    disableScripts: 'npm install --ignore-scripts',
    runApproved: 'npm rebuild <pkg> per approved package',
    source: {
      section: '§4 Package managers supported in v1',
      file: PLAN,
      quote:
        '| npm | `package-lock.json` (v2/v3) | `npm install --ignore-scripts` | `npm rebuild <pkg>` per approved package |',
    },
  },
  {
    id: 'pnpm',
    name: 'pnpm',
    lockfile: 'pnpm-lock.yaml (v6–v9)',
    disableScripts: 'pnpm install --ignore-scripts',
    runApproved: 'pnpm rebuild <pkg>',
    source: {
      section: '§4 Package managers supported in v1',
      file: PLAN,
      quote:
        '| pnpm | `pnpm-lock.yaml` (v6–v9) | `pnpm install --ignore-scripts` | `pnpm rebuild <pkg>` |',
    },
  },
  {
    id: 'yarn-classic',
    name: 'Yarn classic',
    lockfile: 'yarn.lock (v1)',
    disableScripts: 'yarn install --ignore-scripts',
    runApproved: 'run scripts from package dir (lifecycle order)',
    source: {
      section: '§4 Package managers supported in v1',
      file: PLAN,
      quote:
        '| Yarn classic | `yarn.lock` (v1) | `yarn install --ignore-scripts` | run scripts from package dir (lifecycle order) |',
    },
  },
  {
    id: 'yarn-berry',
    name: 'Yarn berry',
    lockfile: 'yarn.lock (YAML, v2+)',
    disableScripts: 'YARN_ENABLE_SCRIPTS=false',
    runApproved: 'write dependenciesMeta.<pkg>.built / yarn rebuild <pkg>',
    source: {
      section: '§4 Package managers supported in v1',
      file: PLAN,
      quote:
        '| Yarn berry | `yarn.lock` (YAML, v2+) | `YARN_ENABLE_SCRIPTS=false` | write `dependenciesMeta.<pkg>.built` / `yarn rebuild <pkg>` |',
    },
  },
  {
    id: 'bun',
    name: 'bun',
    lockfile: 'bun.lock (text, ≥1.2)',
    disableScripts: 'bun install --ignore-scripts',
    runApproved: 'bun pm trust <pkg>',
    source: {
      section: '§4 Package managers supported in v1',
      file: PLAN,
      quote:
        '| bun | `bun.lock` (text, ≥1.2) | `bun install --ignore-scripts` | `bun pm trust <pkg>` |',
    },
  },
];

export const pmDetectionOrder = fact(
  ['lockfile presence', 'packageManager field in package.json', '--pm flag'] as const,
  {
    section: '§4 Package managers supported in v1',
    file: PLAN,
    quote: 'Detection: by lockfile presence, then `packageManager` field in `package.json`,',
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
    'Script downloads + executes (`curl … | sh`, `wget`, `Invoke-WebRequest`, `powershell -enc`)',
    'block',
    '| SI-SCR-002 | Script downloads + executes (`curl … \\| sh`, `wget`, `Invoke-WebRequest`, `powershell -enc`) | high / block |',
  ),
  rule(
    'SI-SCR-003',
    'scripts',
    'Script uses `eval`, `new Function`, `child_process` with dynamic strings, base64 / hex blobs',
    'high',
    '| SI-SCR-003 | Script uses `eval`, `new Function`, `child_process` with dynamic strings, base64 / hex blobs | high |',
  ),
  rule(
    'SI-SCR-004',
    'scripts',
    'Script references secrets paths (`~/.ssh`, `~/.npmrc`, `.env`, `~/.aws`, browser profiles)',
    'high',
    '| SI-SCR-004 | Script references secrets paths (`~/.ssh`, `~/.npmrc`, `.env`, `~/.aws`, browser profiles) | high |',
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
    'New maintainer added on this version / maintainer set changed',
    'high',
    '| SI-REC-002 | New maintainer added on this version / maintainer set changed | high |',
  ),
  rule(
    'SI-POP-001',
    'popularity',
    'Name within edit distance 1–2 of a top-N package (typosquat)',
    'high',
    '| SI-POP-001 | Name within edit distance 1–2 of a top-N package (typosquat) | high |',
  ),
  rule(
    'SI-POP-002',
    'popularity',
    'Very low weekly downloads + install script',
    'medium',
    '| SI-POP-002 | Very low weekly downloads + install script | medium |',
  ),
  rule(
    'SI-INT-001',
    'integrity',
    'Lockfile integrity hash missing or mismatches registry',
    'block',
    '| SI-INT-001 | Lockfile integrity hash missing or mismatches registry | block |',
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
    'SI-VUL-001',
    'vulns',
    'Known advisory (OSV API)',
    'advisory',
    '| SI-VUL-001 | Known advisory (OSV API) | per advisory |',
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

export const releaseAgeNativeSettings = fact('npm `--before <date>`, pnpm `minimumReleaseAge`', {
  section: '§7a Release-age gate — native setting',
  file: PLAN,
  quote: '`minimumReleaseAge`; yarn/bun equivalents verified per version in CI). safe-install',
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
  quote: '**Yarn berry PnP**: supported.',
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
    { code: 0, name: 'ok', description: 'Everything passed.' },
    { code: 1, name: 'policy failure', description: 'A finding crossed your `failOn` threshold.' },
    { code: 2, name: 'user aborted', description: 'You said no and stopped the run.' },
    { code: 3, name: 'tool error', description: 'Something went wrong inside safe-install.' },
  ],
  {
    section: '§8 CLI surface',
    file: PLAN,
    quote: '`0` ok · `1` policy failure · `2` user aborted · `3` tool error',
  },
);

/* -------------------------------------------------------------------------- */
/* §9 Linux runtime monitor                                                    */
/* -------------------------------------------------------------------------- */

export const monitorLinuxOnly = fact(true, {
  section: '§9 Linux-only: runtime monitor',
  file: PLAN,
  quote: 'Not available on macOS/Windows: the CLI says so plainly',
});

export const monitorBackends = fact(['eBPF', 'strace'] as const, {
  section: '§3 Stack — Linux monitor row; §9 Backend',
  file: PLAN,
  quote: '`cilium/ebpf` (preferred) with `strace` fallback, `fsnotify`',
});

export const monitorTracepoints = fact('sys_enter_execve, connect, openat', {
  section: '§9 Linux-only: runtime monitor — Backend',
  file: PLAN,
  quote: 'eBPF (tracepoints `sys_enter_execve`, `connect`, `openat`) when',
});

export const monitorFallbackCommand = fact('strace -f -e trace=execve,connect,openat', {
  section: '§9 Linux-only: runtime monitor — Backend',
  file: PLAN,
  quote: '`strace -f -e trace=execve,connect,openat` fallback;',
});

export const monitorSignals: readonly string[] = [
  'Unexpected network destinations (not the registry)',
  'Spawning shells/downloaders',
  'Reads of secret paths',
  'Writes outside the project / `node_modules` / cache',
  'Writes to shell rc files, `~/.ssh`, `/etc`, cron, systemd units',
];

export const monitorSignalsFact = fact(monitorSignals, {
  section: '§9 Linux-only: runtime monitor — Signals',
  file: PLAN,
  quote: 'unexpected network destinations (not the registry), spawning shells/',
});

export const monitorKill = fact('--monitor=kill', {
  section: '§9 Linux-only: runtime monitor — Action',
  file: PLAN,
  quote: '`--monitor=kill` terminates the process tree on a',
});

export const monitorDefaultAction = fact('report by default', {
  section: '§9 Linux-only: runtime monitor — Action',
  file: PLAN,
  quote: '**Action**: report by default;',
});

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

/**
 * The plan commits to shipping these channels (M8: "`brew install` / `scoop install`
 * work"; §3 Release row lists the Homebrew tap, Scoop bucket and `.deb`/`.rpm`), but
 * does not spell out exact install lines. These are the conventional forms for those
 * channels and are marked as editable in `website/README.md`.
 */
export const distribution = fact(
  {
    homebrew: 'brew install crossben/tap/safe-install',
    scoop: 'scoop install safe-install',
    deb: 'sudo dpkg -i safe-install_0.1.0_linux_amd64.deb',
    rpm: 'sudo rpm -i safe-install-0.1.0-1.x86_64.rpm',
    cosign: 'cosign verify-blob',
    keylessIdentity:
      'https://github.com/crossben/safe-install/.github/workflows/release.yml@refs/tags/v0.1.0',
    keylessIssuer: 'https://token.actions.githubusercontent.com',
  },
  {
    section: '§3 Stack — Release row; §10 M8',
    file: PLAN,
    quote: 'publishes GitHub Releases, Homebrew tap, Scoop bucket, `.deb`/`.rpm`, checksums',
  },
);
