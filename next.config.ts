import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* Hide the floating Next.js dev badge; compile/runtime errors are still shown in dev. */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
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
