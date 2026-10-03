import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fully static export: `npm run build` emits a plain `out/` directory of
  // HTML/CSS/JS that any web server (we ship Caddy) can host. No server code,
  // no API routes, no runtime env vars.
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Static export has no image optimizer at runtime.
    unoptimized: true,
  },
};

export default nextConfig;
