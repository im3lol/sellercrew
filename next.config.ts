import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  reactStrictMode: true,
  // Type-checking runs as a separate step (`bun run typecheck`), so skip it
  // inside `next build` — much faster and avoids the memory-heavy in-build
  // TypeScript pass (important in containers).
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
