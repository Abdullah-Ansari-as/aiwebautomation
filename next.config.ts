import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  /**
   * Add 301 redirects here if legacy URLs from a previous version of the site
   * need to be preserved, e.g. { source: "/old-post", destination: "/blog/new-post", permanent: true }.
   */
  async redirects() {
    return [
      // Old demo admin sections, now combined into the content library.
      { source: "/admin/tools", destination: "/admin/content", permanent: false },
      { source: "/admin/articles", destination: "/admin/content?tab=articles", permanent: false },
      { source: "/admin/categories", destination: "/admin/content?tab=categories", permanent: false },
      // Browsers still ask for /favicon.ico; the site icon is app/icon.svg.
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
    ];
  },
  /**
   * Baseline security headers for every response. HSTS is added by nginx
   * once HTTPS is live (see docs/ORACLE-CLOUD-DEPLOYMENT.md).
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
