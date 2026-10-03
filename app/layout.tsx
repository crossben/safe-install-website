import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { en } from '@/content/en';
import { repo } from '@/content/facts';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

const SITE_URL = `https://${repo.value}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: en.meta.title,
  description: en.meta.description,
  applicationName: 'safe-install',
  authors: [{ name: en.footer.byline.name, url: en.footer.byline.url }],
  keywords: [
    'supply chain security',
    'npm',
    'pnpm',
    'yarn',
    'bun',
    'install scripts',
    'postinstall',
    'malware',
    'CLI',
  ],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    title: en.meta.title,
    description: en.meta.description,
    siteName: 'safe-install',
  },
  twitter: {
    card: 'summary_large_image',
    title: en.meta.title,
    description: en.meta.description,
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
};

/**
 * Runs before first paint so the page never flashes the wrong theme.
 *
 * Deliberately tiny and dependency-free: it must work even if the JS bundle is
 * still in flight. `localStorage` can throw in private browsing, hence the
 * try/catch — a theme flash is not worth a broken page.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-bg"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
