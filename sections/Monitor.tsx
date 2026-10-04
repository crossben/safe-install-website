import { en } from '@/content/en';
import {
  monitorBackend,
  monitorScope,
  monitorKill,
  monitorDefaultAction,
  monitorSignalsFact,
} from '@/content/facts';
import { OsRoast } from '@/components/OsRoast';
import { Section } from '@/components/ui/Section';
import { Reveal } from '@/components/ui/Reveal';

export function Monitor() {
  const { monitor } = en;

  return (
    <Section id="monitor" eyebrow={monitor.eyebrow} heading={monitor.heading} lede={monitor.lede}>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        <Reveal>
          <div className="h-full rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {monitor.howHeading}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{monitor.backendBody}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              <span className="text-accent">{monitorBackend.value}</span> · {monitorScope.value}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="h-full rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {monitor.signalsHeading}
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {monitorSignalsFact.value.map((signal) => (
                <li key={signal} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                  <span aria-hidden="true" className="text-accent">
                    ▸
                  </span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="h-full rounded-lg border border-line bg-surface p-5">
            <h3 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {monitor.actionHeading}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{monitor.actionBody}</p>
            <p className="mt-4 font-mono text-xs text-muted">
              report: <span className="text-ok">{monitorDefaultAction.value}</span>
            </p>
            <p className="mt-1.5 font-mono text-xs text-muted">
              kill: <span className="text-danger">{monitorKill.value}</span>
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal className="mt-10" delay={0.1}>
        <OsRoast copy={monitor.copy} />
      </Reveal>
    </Section>
  );
}
