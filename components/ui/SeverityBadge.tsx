import type { Severity } from '@/content/facts';

/**
 * Tailwind needs these class names to appear verbatim to generate them, so they
 * are written out rather than composed from a severity key.
 */
const STYLE: Record<Severity, string> = {
  block: 'border-danger/45 bg-danger-wash text-danger',
  high: 'border-danger/30 bg-danger-wash text-danger',
  medium: 'border-accent/45 bg-accent-wash text-accent',
  low: 'border-line bg-surface-2 text-muted',
  advisory: 'border-line bg-surface-2 text-muted',
};

const LABEL: Record<Severity, string> = {
  block: 'block',
  high: 'high',
  medium: 'medium',
  low: 'low',
  advisory: 'per advisory',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap ${STYLE[severity]}`}
    >
      {LABEL[severity]}
    </span>
  );
}