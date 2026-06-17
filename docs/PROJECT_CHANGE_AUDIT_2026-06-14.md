# SellerCrew Change and Recovery Audit

Date: 2026-06-14

This document records the major project changes, the reviewed Docker state, and
the exact Git references needed to diagnose or restore the system. It contains
no API keys or credentials.

## Recovery References

| Purpose | Git reference | Commit |
| --- | --- | --- |
| Last merged `main` state | `recovery/merged-main-2026-06-14` | `fb25b00338db9552d785b6dc6ef9393039204235` |
| Reviewed Docker + TypeScript + SSO fixes, with Google login WIP | `recovery/codex-docker-google-wip-2026-06-14` | stash commit `4f11e87` |
| Baseline before the final deployment/review pass | `d002334` | onboarding completed |
| Baseline before backend hardening began | `7b6fff7` | redesigned listing flow |

The WIP tag is important. It preserves changes that were tested successfully
but were later removed from the working tree during a reset to `main`.

## Current Working Tree Warning

At the time this audit was created:

- Current branch: `fix-google-signin`
- Current HEAD: `fb25b00`
- Uncommitted Google sign-in work exists in:
  - `src/components/auth/clerk-google-auth.tsx`
  - `src/components/auth/clerk-runtime-provider.tsx`
  - `src/components/auth/clerk-session-sync.tsx`
- The Docker containers currently running were built from the reviewed WIP
  Dockerfile, but the checked-out Dockerfile is the earlier merged version.

Do not assume that a running Docker image and the current source tree are
identical until the WIP fixes are restored or intentionally replaced.

## Functional Change Timeline

### Real backend and security foundation

| Commit | Change |
| --- | --- |
| `c4ea3b6` | Connected real authentication and Prisma, protected API routes, and fixed workflow defects. |
| `2e21b99` | Added Saleem's policy knowledge base. |
| `a9bc130` | Added the full admin dashboard, system report, settings, API configuration, and metrics. |
| `21eae4a` / `cba578d` | Separated `/admin` from the user workspace while preserving the complete user dashboard. |
| `46d1cbe` | Enforced credits server-side and restricted workspace writes by role. |
| `84b5a4f` | Hardened auth, tracked tokens and failed runs, chunked long policies, and fixed lint issues. |

### Persistence and infrastructure

| Commit | Change |
| --- | --- |
| `c077904` | Persisted projects server-side. |
| `4aa70ad` | Switched Prisma from local storage to PostgreSQL/Supabase. |
| `2536145` | Added encrypted, admin-managed API keys and secrets. |
| `0301d84` | Persisted listings server-side. |
| `928a270` | Stopped storing full-resolution base64 images in localStorage. |
| `2089a83` | Added Redis and BullMQ infrastructure. |
| `3d8de8e` | Added background workflow execution. |
| `4f210ba` | Changed the UI to enqueue and poll workflow jobs. |
| `71aab7d` | Returned Google Drive image links and stored them on assets. |

### Quality, cost, and UX

| Commit | Change |
| --- | --- |
| `c9c366c` | Added estimated AI cost reporting to admin. |
| `7f7b3f5` | Added the initial Vitest suite. |
| `99e5b88` | Grouped admin settings into collapsible sections. |
| `d002334` | Added the first-user onboarding journey. |
| `b51cd3e` | Added Vercel configuration and queue-disable fallback. |
| `aefc196` | Added the first Docker app/worker setup. |
| `52e2da3` | Added README, health endpoint, environment guidance, and more tests. |

### Final hardening pass

Commit `d8be0da` changed 85 files with roughly 3,907 additions and 871
deletions. Its main changes were:

- Separate admin authentication and admin user management.
- Clerk Google authentication and SSO callback routes.
- Google Drive and Google Sheets connection, browsing, selection, and sync.
- Cross-tenant IDOR protection for project and listing writes.
- Per-account login limiting and trusted proxy handling.
- Generic public errors for Google integration failures.
- Direct Google REST calls instead of the large `googleapis` SDK.
- Optimized agent and brand images from about 17.6 MB to about 0.96 MB.
- Dashboard code splitting and reduced client-side animation overhead.
- Admin-configurable provider ordering and AI model fallbacks.
- Default policy data and additional policy-bank behavior.
- CI workflow with typecheck, tests, and build.
- Error, loading, and not-found application states.
- Test suite expanded to 53 tests.

Commit `a5773b5` then removed Framer Motion from the always-mounted dashboard
shell and replaced it with CSS transitions, reducing dashboard JavaScript and
render overhead.

## Reviewed Docker State

The reviewed Docker version was built and run successfully with:

- Next.js web container.
- BullMQ worker container.
- PostgreSQL 17 container.
- Redis 7 container with persistence.
- Prisma schema initialization container.
- Named PostgreSQL and Redis volumes.
- App, database, Redis, and worker health checks.
- Non-root container users.
- OpenSSL installed for Prisma.
- Prisma Client generated inside the worker image.
- TypeScript and all tests executed inside the Linux build.
- Clerk-disabled SSO callback handled without failing prerender.

Verification results from that state:

- TypeScript: passed.
- ESLint: passed.
- Vitest: 53/53 passed.
- Next.js production build: passed.
- Docker app: healthy.
- Docker worker: healthy.
- PostgreSQL: healthy.
- Redis: healthy.
- `/api/health`: database and queue both connected.
- `/`, `/admin`, `/sso-callback`, and public logo assets returned HTTP 200.

The reviewed Docker/SSO source is preserved by:

```bash
git show recovery/codex-docker-google-wip-2026-06-14:Dockerfile
git show recovery/codex-docker-google-wip-2026-06-14:src/app/sso-callback/page.tsx
git show recovery/codex-docker-google-wip-2026-06-14:tsconfig.json
```

## Known Risks and Follow-up Work

1. The current checked-out Dockerfile is older than the reviewed running image.
   Restore or reimplement the WIP Docker changes before rebuilding production.
2. Google sign-in session synchronization is currently uncommitted and must be
   tested before merging.
3. Docker currently initializes a fresh database using `prisma db push`.
   Production should use committed migrations and `prisma migrate deploy`.
4. The application rate limiter is process-local. Multi-instance production
   should store rate-limit state in Redis.
5. Local Docker defaults include development-only database credentials and
   fallback session secrets. Production must override them.
6. Any API keys previously pasted into chat or logs must be rotated.
7. Admin-managed secrets depend on the encryption/session secret. Changing that
   secret without migration makes stored integrations unreadable.

## Recovery Procedures

### Inspect the stable merged state

```bash
git switch --detach recovery/merged-main-2026-06-14
```

### Create a repair branch from the stable merge

```bash
git switch -c recovery/repair recovery/merged-main-2026-06-14
```

### Restore only the reviewed Docker and build files

Run this from a clean repair branch:

```bash
git restore --source=recovery/codex-docker-google-wip-2026-06-14 -- \
  Dockerfile \
  docker-compose.yml \
  .dockerignore \
  .env.docker.example \
  README.md \
  package.json \
  bun.lock \
  next.config.ts \
  tsconfig.json \
  src/app/api/health/route.ts \
  src/app/sso-callback/page.tsx \
  src/lib/workflow.ts
```

Review the resulting diff before committing because the WIP snapshot also
contains concurrent Google login work.

### Restore the complete WIP snapshot

```bash
git switch -c recovery/full-wip recovery/merged-main-2026-06-14
git restore --source=recovery/codex-docker-google-wip-2026-06-14 -- .
```

### Verify after recovery

```bash
bun install --frozen-lockfile
bun run typecheck
bun run test
bun run lint
docker compose build
docker compose up -d
docker compose ps
```

Expected health response:

```json
{"status":"ok","database":true,"queueConfigured":true,"queue":true}
```

## Archive Contents

The `recovery/` directory contains:

- A Git bundle containing branches, tags, commits, and the preserved WIP tag.
- Email-style patches for the functional backend and deployment commits.
- A standalone patch for the current uncommitted Google sign-in work.
- A short recovery README with offline restore commands.
