# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.4 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json next.config.ts postcss.config.mjs vitest.config.ts ./
COPY prisma ./prisma
RUN bunx prisma generate
COPY public ./public
COPY scripts ./scripts
COPY src ./src
COPY next-env.d.ts ./

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"

RUN bun run typecheck
RUN bun run test
RUN bun run build

FROM oven/bun:1.3.4-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
USER bun
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD ["bun", "-e", "const r=await fetch('http://127.0.0.1:3000/api/health');if(!r.ok)process.exit(1)"]
CMD ["bun", "server.js"]

FROM base AS worker
ENV NODE_ENV=production
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json bun.lock tsconfig.json ./
COPY prisma ./prisma
# Generate the Prisma client into the worker image — the worker hits the DB at
# runtime (and the reaper at boot), so the client must be present, not a stub.
RUN bunx prisma generate
COPY src ./src
USER bun
CMD ["bun", "src/worker.ts"]
