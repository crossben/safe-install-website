import Link from 'next/link';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="shell flex min-h-[60vh] flex-col justify-center py-20">
        <p className="font-mono text-sm text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">No such package.</h1>
        <p className="mt-4 max-w-md text-muted">
          This page is not in the dependency tree. The thing you were looking for may have been
          unpublished, renamed, or it may never have existed.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 font-mono text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Back to the top ↑
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
