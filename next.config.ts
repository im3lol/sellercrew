import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  reactStrictMode: true,
  // Type-checking and linting run as separate steps (`bun run typecheck` /
  // `bun run lint`), so skip them inside `next build` — much faster and avoids
  // the memory-heavy in-build TypeScript pass (important in containers).
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
