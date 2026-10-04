import { en } from '@/content/en';
import { rules } from '@/content/facts';
import { DocsShell, Md } from '@/components/docs/Docs';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { explanations } from '@/lib/docs';
import { docsMetadata } from '@/lib/docsPages';

const page = en.docs.rules;
export const metadata = docsMetadata('rules', page);

export default function Page() {
  const explained = new Map(explanations().map((e) => [e.id, e]));
  return (
    <DocsShell slug="rules" page={page}>
      {en.checks.families.map((family) => {
        const familyRules = rules.filter((r) => r.family === family.id);
        if (familyRules.length === 0) return null;
        return (
          <section key={family.id} aria-labelledby={`family-${family.id}`}>
            <h2 id={`family-${family.id}`} className="text-xl font-semibold tracking-tight">
              {family.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{family.blurb}</p>
            <div className="mt-5 flex flex-col gap-4">
              {familyRules.map((rule) => {
                const e = explained.get(rule.id);
                if (!e) throw new Error(`[docs] no explanation for ${rule.id}`);
                return (
                  <article
                    key={rule.id}
                    id={rule.id}
                    className="scroll-mt-24 rounded-lg border border-line bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`#${rule.id}`}
                        className="font-mono text-sm text-accent hover:underline"
                      >
                        {rule.id}
                      </a>
                      <SeverityBadge severity={rule.severity} />
                    </div>
                    <h3 className="mt-2 font-semibold tracking-tight">{e.title}</h3>
                    <dl className="mt-3 flex flex-col gap-3 text-sm leading-relaxed">
                      <div>
                        <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">
                          {page.whyLabel}
                        </dt>
                        <dd className="mt-1 text-ink-soft">
                          <Md text={e.why} />
                        </dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">
                          {page.fixLabel}
                        </dt>
                        <dd className="mt-1 text-ink-soft">
                          <Md text={e.fix} />
                        </dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </DocsShell>
  );
}
