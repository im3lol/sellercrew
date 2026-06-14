# SellerCrew

AI-powered Amazon listing platform. Sellers work with an 11-agent crew (Ali,
Saleem, Noor, Raed, Fares, Hakim, Bayan, Nadeem, Rayan, Adam, Badr) that produces
compliant, evidence-locked listings.

- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind · shadcn/ui
- **Data:** Prisma → PostgreSQL (Supabase)
- **Auth:** email/password (scrypt + signed cookie) + Google via Clerk; separate admin console (`/admin`)
- **AI:** Anthropic → Gemini → OpenRouter fallback chain (admin-configurable)
- **Jobs:** BullMQ + Redis worker (optional; falls back to inline SSE)
- **Storage:** generated images backed up to the user's Google Drive

## Architecture

| Area | Where |
| --- | --- |
| User app (listing workspace) | `/` — `src/components/dashboard/dashboard-v2.tsx` |
| Admin console (separate) | `/admin` — `src/components/admin/admin-dashboard.tsx` |
| Multi-agent workflow engine | `src/lib/workflow-runner.ts` (`runWorkflow`) |
| Streaming entry (SSE) | `src/app/api/full-workflow/stream/route.ts` |
| Background jobs | `src/app/api/full-workflow/jobs/route.ts` + `src/worker.ts` + `src/lib/queue.ts` |
| Server-side credits | `src/lib/server-credits.ts` (atomic charge/refund) |
| Policy knowledge base (Saleem) | `src/lib/policies.ts` + admin Policy Bank |
| Admin-managed secrets | `src/lib/secrets.ts` (AES-GCM in DB, overrides .env) |
| AI providers | `src/lib/ai/providers.ts`, `src/lib/ai/image-generation.ts` |

## Prerequisites

- [Bun](https://bun.sh), a Supabase Postgres database, and (optional) an Upstash Redis.
- Node/Bun toolchain; Docker (optional, for containerized run).

## Environment

Copy `.env.example` → `.env` (or `.env.local`) and fill it in. Key variables:

- `DATABASE_URL` / `DIRECT_URL` — Supabase **pooler** URLs (the direct host is IPv6-only; always use the pooler).
- `SESSION_SECRET` — long random value. **Must stay identical across environments**, because admin-stored secrets (AI keys, Redis URL, Drive tokens) are encrypted with a key derived from it. Change it and those stop decrypting.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH_B64`, `ADMIN_SESSION_SECRET` — the separate `/admin` console login.
- Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) for Google sign-in.
- Google Drive OAuth (`GOOGLE_CLIENT_ID/SECRET`) — or set them from the admin dashboard.
- AI keys + `REDIS_URL` — **manage these from the admin dashboard** (Settings & API → API Keys & Secrets), stored encrypted in the DB. `.env` values are a fallback.

## Run locally

```bash
bun install
bun run db:push        # sync schema to Supabase + generate the Prisma client
bun run dev            # app on http://localhost:3000
bun run worker         # SEPARATE terminal — the BullMQ background worker
```

> The worker is required only if `REDIS_URL` is set. Without it, the workflow runs
> inline via SSE (no worker needed). The first registered account becomes admin.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server (port 3000) |
| `bun run worker` | BullMQ background worker (separate process) |
| `bun run build` / `bun run start` | Production build / start (standalone) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint |
| `bun run test` | Vitest unit tests |
| `bun run db:push` | Push schema + generate client |

## Docker

Runs the app and the worker together:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<pk> docker compose build
docker compose up
```

`docker-compose.yml` reads `.env` + `.env.local`. The app and worker share one image
(`Dockerfile`). Give Docker Desktop ≥ 4 GB RAM. Health probe: `GET /api/health`.

## Deploy

- **Container host (Railway / Render / Fly.io / VPS):** deploy the Docker image; run
  two services — `bun .next/standalone/server.js` (app) and `bun src/worker.ts`
  (worker). Full functionality, recommended.
- **Vercel:** the app deploys fine, but Vercel cannot run the always-on worker. Either
  set `WORKFLOW_QUEUE_DISABLED=1` (forces the inline SSE workflow — needs Vercel Pro for
  the 300s function limit), or run the worker separately on Railway/Render. `vercel.json`
  is preconfigured.

Whichever host: keep `SESSION_SECRET` identical to where the DB secrets were encrypted,
and set the Vercel/host domain in Clerk (allowed origins) and the Google OAuth redirect
URI (`https://<domain>/api/google-drive/callback`).
