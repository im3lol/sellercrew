import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  reactStrictMode: true,
  // Type-checking runs as a separate step (`bun run typecheck`), so skip it
  // inside `next build` -- faster and avoids the memory-heavy in-build TS pass.
  typescript: { ignoreBuildErrors: true },
  // Keep heavy, server-only native/IO packages out of the bundle trace so the
  // build is faster and the standalone output stays slim.
  serverExternalPackages: ["sharp", "bullmq", "ioredis"],
  experimental: {
    // Tree-shake barrel imports from these big UI libs so only the icons/
    // components actually used end up in the client bundle.
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "react-syntax-highlighter",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
