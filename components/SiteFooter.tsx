import { en } from '@/content/en';
import { license } from '@/content/facts';

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line">
      <div className="shell py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-sm font-medium">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-sm bg-accent" />
              safe-install
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              {en.footer.tagline}
            </p>
            <p className="mt-6 font-mono text-xs text-muted">
              Licensed under {license.value}
            </p>
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

        <div className="mt-12 border-t border-line pt-6">
          <p className="max-w-2xl text-xs leading-relaxed text-muted">
            {en.footer.telemetryBody}
          </p>
        </div>
      </div>
    </footer>
  );
}