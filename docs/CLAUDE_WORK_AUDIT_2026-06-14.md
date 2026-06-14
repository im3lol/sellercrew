# SellerCrew — Claude (Anthropic) Work Audit — 2026-06-14

Companion to [`PROJECT_CHANGE_AUDIT_2026-06-14.md`](./PROJECT_CHANGE_AUDIT_2026-06-14.md)
(authored by the Codex session, which focuses on recovery refs + Docker review).

This file inventories **the work done in the Claude sessions** — every improvement,
the task ledger, verification status, the still-open review findings, and exact
restore/rollback instructions. No secrets/credentials are included.

> Scope note: the entire **functional implementation** from baseline `7b6fff7`
> onward (auth, Prisma/Supabase, admin console, policy bank, credits, BullMQ,
> Drive, perf, security, tests, Google sign-in) was built in the Claude sessions.
> The **Codex** session contributed the `recovery/` tooling + bundle, the
> companion audit, and the Docker/tsconfig/SSO-guard review edits.

---

## 1. Current Git state (authoritative, at time of writing)

| Item | Value |
| --- | --- |
| Current branch | `fix-google-signin` |
| Current HEAD | `a6f89e3` — Fix Google sign-in: sync Clerk session globally |
| Stable mainline | `main` = `fb25b00` (merge of PR #1) |
| Last pre-feature baseline | `7b6fff7` (redesigned listing flow, before backend work) |
| My local stash | `stash@{0}` — reset-to-main backup (my Google WIP + Codex Docker/tsconfig/SSO edits) |
| Codex recovery refs | `recovery/merged-main-2026-06-14` (=`fb25b00`), `recovery/codex-docker-google-wip-2026-06-14` |

**"Normal state" = `main` (`fb25b00`).** It is clean, builds, and passes all tests.
The only work not yet on `main` is the Google sign-in fix (`a6f89e3`, on branch
`fix-google-signin`) and Codex's Docker/recovery edits.

---

## 2. Task ledger

Tracked tasks for the performance/security/quality pass (all completed):

| # | Task | Status | Commit |
| --- | --- | --- | --- |
| 1 | Replace `googleapis` SDK with direct Drive/Sheets REST | ✅ | `d8be0da` |
| 2 | `next.config` perf (optimizePackageImports, serverExternalPackages, images) | ✅ | `d8be0da` |
| 3 | Runtime perf audit + fixes (images, code-split, store, prisma log) | ✅ | `d8be0da`, `a5773b5` |
| 4 | Security review + fixes (IDOR, rate-limit spoofing, error leaks) | ✅ | `d8be0da` |
| 5 | Expand test suite to 53 | ✅ | `d8be0da` |
| 6 | Drive links in assets UI | ✅ | `d8be0da` |
| 7 | Custom 404 / error / loading pages | ✅ | `d8be0da` |
| 8 | CI (GitHub Actions: typecheck + test + build) | ✅ | `d8be0da` |
| 9 | Google sign-in fix (global Clerk→app session sync) | ✅ | `a6f89e3` |

Earlier roadmap tasks (pre-pass, also completed in the Claude sessions) are listed
in §3 under their commits.

---

## 3. Improvements by theme

Each row: what changed, why, key files, the commit, and how to revert just that piece.

### 3.1 Authentication & accounts
| Change | Why | Key files | Commit |
| --- | --- | --- | --- |
| Real auth (scrypt + HMAC signed cookie, zero new deps) | replace mock/localStorage auth | `src/lib/auth.ts`, `src/lib/api-guard.ts`, `src/lib/account.ts`, `src/app/api/auth/*` | `c4ea3b6` |
| Separate `/admin` console (ADMIN_EMAIL gated) | isolate admin from users | `src/app/admin/*`, `src/components/admin/*`, `src/app/api/admin/auth/*` | `a9bc130`, `21eae4a`, `cba578d` |
| Global `User.role`; first user = admin | role-based nav/API gating | `prisma/schema.prisma`, `src/lib/api-guard.ts` | `84b5a4f` |
| **Google sign-in fix — global session sync** | sync ran only inside the button (mounted on auth view), so OAuth redirect landing elsewhere silently failed | `src/components/auth/clerk-session-sync.tsx` (new), `clerk-runtime-provider.tsx`, `clerk-google-auth.tsx` | `a6f89e3` |

### 3.2 Data & persistence
| Change | Why | Key files | Commit |
| --- | --- | --- | --- |
| Projects persisted server-side | leave localStorage | `src/app/api/projects/route.ts`, `src/lib/dashboard-store.ts` | `c077904` |
| Listings persisted server-side | same | `src/app/api/listings/route.ts` | `0301d84` |
| SQLite → PostgreSQL/Supabase (pooler) | real DB | `prisma/schema.prisma`, `src/lib/db.ts`, `.env.example` | `4aa70ad` |
| Stop persisting full-res base64 in localStorage | quota/perf | `src/lib/dashboard-store.ts` | `928a270` |

### 3.3 Credits, policy, AI
| Change | Why | Key files | Commit |
| --- | --- | --- | --- |
| Server-enforced atomic credits | prevent client tampering | `src/lib/server-credits.ts`, `src/lib/credits.ts` | `46d1cbe` |
| Policy knowledge bank (Saleem) | compliance memory | `src/lib/policies.ts`, `src/lib/default-policies.ts`, `src/app/api/policies/*` | `2e21b99` |
| Admin-configurable provider order + model fallbacks | resilience | `src/lib/ai/providers.ts`, `src/lib/settings.ts` | `d8be0da` |
| Admin-managed encrypted secrets (AES-GCM in DB) | no .env editing | `src/lib/secrets.ts`, `src/app/api/admin/secrets/route.ts` | `2536145` |

### 3.4 Background jobs / infra
| Change | Why | Key files | Commit |
| --- | --- | --- | --- |
| Redis + BullMQ infra | offload long workflow | `src/lib/queue.ts`, `src/worker.ts` | `2089a83` |
| Workflow as background job + UI polling | 300s limit / resumable | `src/lib/workflow-runner.ts`, `src/lib/workflow-job-runner.ts`, `src/app/api/full-workflow/*` | `3d8de8e`, `4f210ba` |
| Google Drive/Sheets sync + links on assets | image backup | `src/lib/google-drive.ts`, `src/app/api/google-drive/*` | `71aab7d` |

### 3.5 Performance pass (`d8be0da`, `a5773b5`)
- **Removed `googleapis` SDK** → direct `fetch` to Drive/Sheets/OAuth (`src/lib/google-drive.ts`). Big build-weight cut.
- **Images 17.6 MB → 0.96 MB** in place via `scripts/optimize-images.mjs` (agent avatars/brand PNGs).
- **Dashboard code-split** with `next/dynamic` (page modules + Auth/Dashboard shells); `useShallow` store reads (`src/components/dashboard/dashboard-v2.tsx`, `src/app/page.tsx`).
- **Dropped framer-motion** from the always-mounted dashboard shell → CSS transitions (`a5773b5`).
- `next.config.ts`: `optimizePackageImports`, `serverExternalPackages`, AVIF/WebP, `ignoreBuildErrors`.
- Prisma query logging off in production (`src/lib/db.ts`).

### 3.6 Security pass (`d8be0da`)
- **Cross-tenant IDOR fixed** in `POST /api/projects` and `/api/listings` (upsert on bare client `id` → ownership-checked).
- **Rate-limit anti-spoof**: per-account login limiter + `TRUSTED_PROXY_COUNT` for `x-forwarded-for` (`src/lib/rate-limit.ts`, `src/app/api/auth/login/route.ts`).
- Google Drive routes log detail server-side, return generic errors.

### 3.7 Quality / DX
- **Tests: 53** (`src/lib/*.test.ts` — auth, pricing, compliance, credits, rate-limit, settings merge, secrets sanitization, provider chain + JSON repair, workflow status coercion).
- **CI**: `.github/workflows/ci.yml` (typecheck + test + build).
- `/api/health` public probe; `src/app/{not-found,error,loading}.tsx`.
- `README.md`, `.env.example` (Supabase pooler, REDIS_URL, TRUSTED_PROXY_COUNT, queue disable).
- Onboarding journey (`d002334`); collapsible admin settings (`99e5b88`).

---

## 4. Verification status (branch `fix-google-signin` @ `a6f89e3`)

| Check | Result |
| --- | --- |
| `bun run typecheck` | ✅ clean |
| `bun run test` | ✅ 53/53 |
| `bun run build` | ✅ all routes compile |
| Live dev boot | ✅ `/`, `/api/health`, `/sso-callback` → 200; DB + Redis connected |

> Not verifiable here: the live Google OAuth round-trip (needs a browser + Clerk
> dashboard config: Google connection enabled, Allowed origins, `/sso-callback`).

---

## 5. Outstanding review findings (to return to)

> **Stabilization pass (branch `fix-google-signin`, after `a6f89e3`) — FIXED:**
> Critical #1 (crash → lost credits/stuck job): added `creditId/charged/refunded`
> to `WorkflowJob`, `onCharge`/`onRefund` callbacks, and a worker **startup reaper**
> that fails + refunds stranded jobs. · Critical #2 (double-charge on retry):
> `attempts:1` + `lockDuration` 10m + `maxStalledCount:0`. · High #3: blocked
> results now go through `normalizeResult` (safeParse). · High #4: Drive uploads
> use `allSettled` (partial failures reported, sync no longer all-or-nothing). ·
> High #5: access-token caching + connection cleanup on revoked refresh token. ·
> High #6: `refundCredits` is now single-shot. · `.env.example`: added
> `GEMINI_IMAGE_MODEL` + documented `ADMIN_PASSWORD_HASH`.
>
> **Still open:** #4 idempotent-by-name upload (dedupe on manual re-sync); #7
> data-model (dead `Asset`/`Generation`/`AgentRun`/`ActivityLog` models + localStorage
> divergence — product decision); #8 Redis-backed rate limiter for multi-instance;
> #9 Prisma migrations; optional dep cleanup (`next-auth`/`z-ai-web-dev-sdk`/`next-intl`
> + dead shadcn components — deferred to avoid risky install churn); shared `resolveOrg`
> + rate-limit on projects/listings CRUD.

From two independent reviews. **Not yet fixed** unless noted.

### Critical (credits integrity)
1. **Worker crash mid-job loses credits + strands job in "running"** — charge happens in `runWorkflow` with no reaper; refund only in its own catch. Record the charge on the `WorkflowJob` row + add a reaper/stalled-job handler. (`src/lib/workflow-runner.ts`, `workflow-job-runner.ts`)
2. **BullMQ retry can double-charge** — no `attempts:1`/idempotency; a stalled re-run re-charges. Make the charge idempotent per `jobId`. (`src/app/api/full-workflow/jobs/route.ts`)

### High
3. Blocked/deterministic workflow results bypass `fullWorkflowResultSchema.parse()`. (`workflow-runner.ts`)
4. Drive sync: one failed image fails the whole sync + duplicates on retry → use `allSettled` + idempotent upload. (`src/lib/google-drive.ts`, `api/google-drive/sync`)
5. Drive access token refreshed every call, no cache; revoked refresh token never cleans up the connection. (`src/lib/google-drive.ts`)
6. `refundCredits` not single-shot (can drive `used` negative). (`src/lib/server-credits.ts`)
7. **Architecture:** assets/activities/workflowRuns are localStorage-only → no multi-device/teammate consistency; `Asset`/`Generation`/`AgentRun`/`ActivityLog` DB models are **dead** (never written; admin report counts them as 0). Decide source of truth.
8. In-memory rate limiter + 30s caches are per-instance → wrong on Vercel/multi-instance. Back with Redis.
9. `db push` only, no migrations → adopt `prisma migrate deploy` before prod.

### Medium / cleanup
- Unused deps: `next-auth`, `z-ai-web-dev-sdk`, `next-intl`, plus dead shadcn components (`chart/drawer/carousel/calendar/input-otp/resizable`) and their deps.
- Duplicated `resolveOrg`; projects/listings routes lack rate limiting.
- `.env.example` missing `GEMINI_IMAGE_MODEL`; reconcile `ADMIN_PASSWORD_HASH` vs `_B64`.
- Vercel: no worker → queue dead → SSE-only (300s cap). Document "long workflows need the container target."

---

## 6. Restore / rollback to normal

**"Normal" = `main` (`fb25b00`).**

```bash
# Go back to the clean, known-good mainline:
git switch main          # or: git switch --detach recovery/merged-main-2026-06-14
git status               # should be clean
# if stale build caches cause local typecheck noise:
#   remove .next-local / .next-local-build (gitignored caches), then re-run typecheck
```

Revert an individual improvement (each is its own commit — see §3):
```bash
git revert <commit>      # e.g. git revert a5773b5  (undo framer-motion removal)
```

Recover the Google sign-in fix specifically:
```bash
git switch fix-google-signin     # it lives here as commit a6f89e3
# or cherry-pick onto another branch:
git cherry-pick a6f89e3
```

My local stash (mixed WIP backup) and Codex's recovery bundle/patches under
`recovery/` provide additional restore paths (see Codex's audit §"Recovery Procedures").

---

## 7. Coordination note (root cause of the collisions)

Both the Claude and Codex sessions edited the **same working directory**
(`E:\Dev\SellerCrew`) concurrently, which is why edits kept overwriting each
other (e.g. `next.config.ts` `ignoreBuildErrors` repeatedly stripped). Going
forward: one branch/worktree per session, merge via PR (as done for PR #1).
