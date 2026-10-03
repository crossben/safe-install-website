import { en } from '@/content/en';
import { repo } from '@/content/facts';
import { ThemeToggle } from './ui/ThemeToggle';

const REPO_URL = `https://github.com/${repo.value}`;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2 font-mono text-sm font-medium tracking-tight"
        >
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-sm bg-accent"
          />
          <span>safe-install</span>
          <span aria-hidden="true" className="text-accent">
            _
          </span>
        </a>

        {/*
          The full nav is hidden below `lg`. Eight links cannot fit at 360px
          without either wrapping or scrolling sideways, so mobile gets the
          footer list instead — no horizontal scroll, no hamburger that hides
          most of the page behind a click.
        */}
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {en.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-md px-2.5 py-1.5 font-mono text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="hidden items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-mono text-[13px] text-muted transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.88 2.34.67.07-.52.28-.88.51-1.08-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}