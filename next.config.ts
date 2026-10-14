import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bound build worker memory on development and small deployment hosts.
  experimental: { cpus: 2 },
  poweredByHeader: false,
  async redirects() {
    return [
      ["b2b-platforms", "digital-platform-creation"],
      ["b2c-platforms", "experience-design"],
      ["d2c-commerce", "prototyping"],
      ["custom-web-apps", "software-development"],
      ["saas-automation", "digital-innovation"],
      ["business-automation", "workflow-tools"],
    ].map(([from, to]) => ({
      source: "/solutions/" + from,
      destination: "/solutions/" + to,
      permanent: true,
    }));
  },
  async headers() {
    // React's development stack reconstruction requires eval; production does not.
    const developmentScriptPolicy =
      process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${developmentScriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
