
import type {NextConfig} from 'next';

// Auto-generate build timestamp — works on all platforms (Windows, Linux, Mac)
const BUILD_TIME = String(Date.now());
if (!process.env.NEXT_PUBLIC_BUILD_TIME) {
  process.env.NEXT_PUBLIC_BUILD_TIME = BUILD_TIME;
}

/**
 * Image Architecture (v2.0 — Audit Cleanup)
 *
 * This project does NOT use next/image (<Image>) anywhere.
 * All images use native <img> with direct URLs (uploaded via /api/cms/upload
 * dan disimpan di MongoDB Base64/Data URL, atau URL publik).
 * Vercel Image Optimization is therefore never triggered.
 *
 * The `images` config block has been removed — it was dead code.
 * If <Image> is needed in the future, re-add the block with current values.
 */

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Mongoose (native MongoDB driver) must run on the server, not be bundled.
  serverExternalPackages: ['mongoose'],
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/favicon_io/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      {
        source: '/(.*\.html)',
        headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
