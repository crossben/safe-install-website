import { en } from '@/content/en';
import { dropIn, packageManagers, pmDetectionOrder } from '@/content/facts';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function PackageManagers() {
  const { packageManagers: copy } = en;

  return (
    <Section id="package-managers" eyebrow={copy.eyebrow} heading={copy.heading} lede={copy.lede}>
      <Reveal className="mt-12">
        <div className="min-w-0 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <caption className="sr-only">
              Supported package managers, their lockfiles, and how scripts are disabled and run.
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-2">
                {copy.columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-4 py-3 font-mono text-xs tracking-wide text-muted uppercase"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packageManagers.map((pm) => (
                <tr key={pm.id} className="border-b border-line bg-surface last:border-0">
                  <th scope="row" className="px-4 py-3.5 font-mono text-sm font-medium text-ink">
                    {pm.name}
                  </th>
                  <td className="px-4 py-3.5 font-mono text-xs text-muted">{pm.lockfile}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-ink-soft">
                    {pm.disableScripts}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-ink-soft">{pm.runApproved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      <Reveal className="mt-8" delay={0.1}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              How it picks one
            </h3>
            <ol className="mt-3 flex flex-col gap-2">
              {pmDetectionOrder.value.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm text-muted">
                  <span aria-hidden="true" className="font-mono text-xs text-accent">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              Drop-in replacement
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              safe-install takes the place of{' '}
              <span className="font-mono text-xs text-ink-soft">{dropIn.value}</span>. Your lockfile
              stays the source of truth; the package manager stays the thing that does the
              installing.
            </p>
            <p className="mt-3 font-mono text-xs text-muted">{copy.detectionNote}</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
