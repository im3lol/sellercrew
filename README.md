# SellerCrew

AI-powered Amazon listing platform. Sellers work with an 11-agent crew that
produces compliant, evidence-locked listings.

- Stack: Next.js 16, React 19, TypeScript, Tailwind, shadcn/ui
- Data: Prisma and PostgreSQL
- Auth: email/password plus Google through Clerk; separate `/admin` console
- AI: Anthropic, Gemini, OpenAI, and OpenRouter with configurable fallbacks
- Jobs: BullMQ and Redis, with an inline streaming fallback
- Storage: Google Drive and Sheets integration

## Architecture

| Area | Location |
| --- | --- |
| User workspace | `src/components/dashboard/dashboard-v2.tsx` |
| Admin console | `src/components/admin/admin-dashboard.tsx` |
| Workflow engine | `src/lib/workflow-runner.ts` |
| Streaming workflow | `src/app/api/full-workflow/stream/route.ts` |
| Background jobs | `src/app/api/full-workflow/jobs/route.ts` and `src/worker.ts` |
| Server-side credits | `src/lib/server-credits.ts` |
| Policy knowledge base | `src/lib/policies.ts` |
| Admin-managed secrets | `src/lib/secrets.ts` |
| AI providers | `src/lib/ai/providers.ts` and `src/lib/ai/image-generation.ts` |

## Local Development

Copy `.env.example` to `.env` (the single env file read by Next.js, Prisma, and
docker compose alike), configure PostgreSQL and the integrations you need, then run:

```bash
bun install
bun run db:push   # local scratch DB; Docker/production use `bun run db:deploy` (migrations)
bun run dev
```

Run the worker in a separate terminal when `REDIS_URL` is configured:

```bash
bun run worker
```

Platform admin access is separate from user accounts. Configure it only with
`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH_B64`, and `ADMIN_SESSION_SECRET`.

## Quality Checks

```bash
bun run typecheck
bun run test
bun run lint
bun run build
```

## Docker

The Compose stack is self-contained: Next.js app, BullMQ worker, PostgreSQL,
Redis, persistent volumes, schema initialization, and health checks.

```bash
cp .env.docker.example .env
docker compose up --build -d
docker compose ps
```

Open `http://localhost:3000`. The first start runs `prisma db push` before the
app and worker are allowed to start. PostgreSQL and Redis data persist in named
volumes.

Docker uses its bundled database and Redis by default, even when normal local
development points to Supabase or Upstash. Set `DOCKER_DATABASE_URL`,
`DOCKER_DIRECT_URL`, or `DOCKER_REDIS_URL` only when intentionally using
external services.

To reset all local Docker data:

```bash
docker compose down -v
```

The application health endpoint is `GET /api/health`.

## Deployment

For a container host, deploy both Docker targets: `web` for Next.js and
`worker` for BullMQ. Use managed PostgreSQL and Redis in production and run
`prisma migrate deploy` once migration files are introduced.

Vercel cannot host the always-on BullMQ worker. Run the worker on a separate
container host, or set `WORKFLOW_QUEUE_DISABLED=1` to use the inline workflow.
Keep `SESSION_SECRET` stable because stored integration secrets are encrypted
from it.
