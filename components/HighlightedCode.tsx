import { highlight } from '@/lib/highlight';
import type { CodeSample } from '@/content/types';
import { CodeBlock } from './ui/CodeBlock';

/**
 * Server component: highlights samples during `next build` and hands the HTML
 * to the client `CodeBlock`. Never reaches the browser as source.
 */
export async function HighlightedCode({
  samples,
  className = '',
}: {
  samples: readonly CodeSample[];
  className?: string;
}) {
  const rendered = await Promise.all(
    samples.map(async (sample) => ({
      sample,
      html: await highlight(sample.code, sample.lang),
    })),
  );

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {rendered.map(({ sample, html }) => (
        <CodeBlock
          key={sample.label}
          html={html}
          code={sample.code}
          label={sample.label}
        />
      ))}
    </div>
  );
}