'use client';

import { CopyButton } from './CopyButton';

/**
 * A code block whose highlighting already happened at build time.
 *
 * `html` is the Shiki output produced by `lib/highlight.ts` in a server
 * component. Shipping it as a string means the highlighter itself never
 * reaches the browser — no grammar bundle, no re-highlighting on toggle.
 *
 * The block is dark in both themes; see the Shiki note in `globals.css`.
 */
export function CodeBlock({
  html,
  code,
  label,
  className = '',
}: {
  html: string;
  code: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-white/10 bg-term-bg ${className}`}>
      {label ? (
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="font-mono text-[11px] tracking-wide text-term-muted uppercase">
            {label}
          </span>
          <CopyButton
            text={code}
            className="border-transparent px-1.5 py-0.5 text-term-muted hover:border-white/20 hover:text-term-accent"
          />
        </div>
      ) : null}
      <div
        className="code-scroll overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
