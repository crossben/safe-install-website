/**
 * The shape of every string on the site.
 *
 * Components never contain copy. They read from a module that satisfies
 * `SiteContent`, which means a future `content/fr.ts` gets its spelling and
 * omissions checked by the compiler rather than by a human reading French.
 *
 * Factual *values* (rule IDs, exit codes, commands) live in `content/facts.ts`
 * and are cited back to their source. Only prose belongs here.
 */

/** Languages the inline code blocks are highlighted with. */
export type CodeLang = 'bash' | 'powershell' | 'json' | 'yaml' | 'text';

export type CodeSample = {
  readonly label: string;
  readonly lang: CodeLang;
  readonly code: string;
};

export type NavItem = {
  readonly label: string;
  readonly href: string;
};

export type Cta = {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
};

/** One line in the hero's animated terminal. `tone` drives the colour. */
export type TerminalLine = {
  readonly text: string;
  /** `prompt` is the typed command, `muted` is chrome, the rest are findings. */
  readonly tone?: 'prompt' | 'muted' | 'info' | 'warn' | 'danger' | 'ok';
};

export type ProblemPoint = {
  readonly title: string;
  readonly body: string;
};

export type Step = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
};

export type FamilyCopy = {
  /** Must match a `RuleFamily` in `facts.ts`. */
  readonly id:
    | 'scripts'
    | 'recency'
    | 'popularity'
    | 'integrity'
    | 'maintenance'
    | 'policy'
    | 'vulns'
    | 'code'
    | 'monitor';
  readonly title: string;
  readonly blurb: string;
};

export type SeverityCopy = {
  readonly id: 'low' | 'medium' | 'high' | 'block' | 'advisory';
  readonly label: string;
  readonly description: string;
};

export type ComparisonRow = {
  readonly language: string;
  readonly verdict: string;
  readonly note: string;
};

/** The per-OS joke block shown once we know the visitor's platform. */
export type Roast = {
  readonly headline: string;
  readonly jabs: readonly string[];
  /** Omitted on Linux, which gets a smug badge instead of a call to action. */
  readonly cta?: string;
  readonly isSmug?: boolean;
};

export type MonitorCopy = {
  readonly neutral: string;
  readonly roasts: {
    readonly windows: Roast;
    readonly macos: Roast;
    readonly linux: Roast;
    readonly unknown: Roast;
  };
  /** Shown under every roast, whichever platform the visitor is on. */
  readonly honest: string;
};

export type InstallMethod = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly samples: readonly CodeSample[];
};

/** A docs page's prose. `body` paragraphs may use `code` spans. */
export type DocsSection = {
  readonly id: string;
  readonly title: string;
  readonly body: readonly string[];
};

export type DocsPage = {
  readonly title: string;
  /** Meta description and the line under the title. */
  readonly description: string;
  readonly sections: readonly DocsSection[];
};

export type DocsContent = {
  readonly navLabel: string;
  readonly sourceLabel: string;
  readonly editLabel: string;
  readonly index: DocsPage;
  readonly gettingStarted: DocsPage;
  readonly usage: DocsPage & {
    readonly answers: readonly { readonly key: string; readonly meaning: string }[];
    readonly modes: readonly { readonly when: string; readonly what: string }[];
  };
  readonly policy: DocsPage & {
    readonly fields: readonly { readonly name: string; readonly meaning: string }[];
    readonly locations: readonly { readonly where: string; readonly path: string }[];
  };
  readonly checkAndCi: DocsPage & {
    readonly inputs: readonly { readonly name: string; readonly meaning: string }[];
  };
  readonly monitor: DocsPage;
  readonly rules: DocsPage & {
    readonly whyLabel: string;
    readonly fixLabel: string;
  };
};

export type SiteContent = {
  readonly meta: {
    readonly title: string;
    readonly description: string;
    readonly ogAlt: string;
  };
  readonly nav: readonly NavItem[];
  readonly hero: {
    readonly promise: string;
    readonly subline: string;
    readonly primaryCta: Cta;
    readonly secondaryCta: Cta;
    readonly installTabs: readonly {
      readonly os: string;
      readonly samples: readonly CodeSample[];
    }[];
    readonly terminalTitle: string;
    readonly terminalLines: readonly TerminalLine[];
    readonly footnote: string;
  };
  readonly problem: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly points: readonly ProblemPoint[];
    readonly kicker: string;
  };
  readonly howItWorks: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly steps: readonly Step[];
    readonly note: string;
  };
  readonly checks: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly families: readonly FamilyCopy[];
    readonly severities: readonly SeverityCopy[];
    readonly scoringNote: string;
    readonly explainNote: string;
    readonly releaseAgeGate: {
      readonly heading: string;
      readonly body: string;
      readonly native: string;
      readonly fallback: string;
      readonly override: string;
      readonly credit: string;
    };
  };
  readonly packageManagers: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly columns: readonly { readonly key: string; readonly label: string }[];
    readonly detectionNote: string;
  };
  readonly whyGo: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly reasons: readonly { readonly title: string; readonly body: string }[];
    readonly comparisonHeading: string;
    readonly comparisonRows: readonly ComparisonRow[];
    readonly notViaNpmHeading: string;
    readonly notViaNpmBody: string;
    readonly releaseHeading: string;
    readonly releaseBody: string;
  };
  readonly monitor: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly howHeading: string;
    readonly backendBody: string;
    readonly signalsHeading: string;
    readonly actionHeading: string;
    readonly actionBody: string;
    readonly copy: MonitorCopy;
  };
  readonly ci: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly commandHeading: string;
    readonly command: string;
    readonly exitCodesHeading: string;
    readonly exitCodesNote: string;
    readonly workflowTitle: string;
    readonly workflow: CodeSample;
    readonly flagNote: string;
  };
  readonly install: {
    readonly eyebrow: string;
    readonly heading: string;
    readonly lede: string;
    readonly methods: readonly InstallMethod[];
    readonly dropInNote: string;
  };
  readonly docs: DocsContent;
  readonly footer: {
    readonly tagline: string;
    readonly byline: {
      readonly label: string;
      readonly name: string;
      readonly url: string;
    };
    readonly securityHeading: string;
    readonly securityBody: string;
    readonly telemetryBody: string;
    readonly links: readonly NavItem[];
  };
};
