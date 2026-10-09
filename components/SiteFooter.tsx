import { en } from '@/content/en';
import { license } from '@/content/facts';

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="shell py-14">
      {/* Next project: the three open-source projects link to each other in a ring. */}
      <div className="mb-10">
        <a
          href="https://yoonpay.benhattab.pro"
          className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-lg border border-line px-5 py-4 transition-colors hover:border-accent"
        >
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Next project
          </span>
          <span className="flex-1 text-sm">
            <span className="font-medium transition-colors group-hover:text-accent">Yoon</span>{" "}
            <span className="text-muted">{"— one API in front of Africa's payment providers"}</span>
          </span>
          <span aria-hidden="true" className="text-muted transition-colors group-hover:text-accent">→</span>
        </a>
      </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-sm font-medium">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm bg-accent" />
              safe-install
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{en.footer.tagline}</p>

            <p className="mt-6 font-mono text-xs text-muted">
              {en.footer.byline.label}{' '}
              {/* rel="me" marks this as a link to the author's own identity page. */}
              <a
                href={en.footer.byline.url}
                target="_blank"
                rel="me noopener noreferrer"
                className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent"
              >
                {en.footer.byline.name}
              </a>
            </p>

            <p className="mt-2 font-mono text-xs text-muted">Licensed under {license.value}</p>
          </div>

          <nav aria-label="Footer">
            <h2 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Links</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {en.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-ink-soft transition-colors hover:text-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="font-mono text-xs tracking-[0.18em] text-muted uppercase">
              {en.footer.securityHeading}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              {en.footer.securityBody}
            </p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {en.footer.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 font-mono text-sm text-ink-soft transition-colors hover:text-accent"
                  >
                    {link.label}
                    <span aria-hidden="true" className="text-muted">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* <div className="mt-12 border-t border-line pt-6">
          <p className="max-w-2xl text-xs leading-relaxed text-muted">{en.footer.telemetryBody}</p>
        </div> */}
      </div>
    </footer>
  );
}
