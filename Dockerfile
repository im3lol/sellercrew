# Single image that runs both the Next app and the BullMQ worker.
FROM oven/bun:1
WORKDIR /app
ENV HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1

# Install all dependencies (dev deps are needed for the build).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Generate the Prisma client.
COPY prisma ./prisma
RUN bunx prisma generate

# App source + build (NEXT_PUBLIC_* must exist at build time to be inlined).
COPY . .
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN bunx next build && bun scripts/prepare-standalone.mjs

EXPOSE 3000
# Default = web app. The worker service overrides this command.
CMD ["bun", ".next/standalone/server.js"]
