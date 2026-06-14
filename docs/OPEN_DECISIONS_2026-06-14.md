# SellerCrew — Open Architectural Decisions — 2026-06-14

These three findings from the review are **deliberately not changed in code yet**
because each is a real trade-off / needs coordination or a product call. Changing
them blindly would risk the stability the rest of the work secured. Each has a
concrete recommendation and exact steps so they can be done intentionally.

Everything else from the review has been fixed (see
[`CLAUDE_WORK_AUDIT_2026-06-14.md`](./CLAUDE_WORK_AUDIT_2026-06-14.md) §5).

---

## D1. Multi-instance rate limiting (Redis-backed)

**State:** `src/lib/rate-limit.ts` is an in-memory fixed window. Correct for a
single instance (current local/Docker deployment); on Vercel or multiple replicas
each instance has its own counters, so effective limits multiply by N.

**Why not done now:** `rateLimit()` is synchronous and on the auth hot path
(login/register/admin/guard). Making it Redis-backed means making it async,
threading a Redis client + graceful fallback through auth, and the test suite —
real risk for a benefit that only applies once the app runs multi-instance, which
it does not today.

**Recommendation:** do it as its own change when moving to multi-instance.
- Make `rateLimit` async; add `await` at the ~5 call sites (all already async).
- Use a shared ioredis client (reuse `getRedisConnectionOptions()` parsing) with
  `INCR` + `PEXPIRE` (atomic fixed window) and `enableOfflineQueue:false`,
  `maxRetriesPerRequest:1`.
- On any Redis error, fall back to the existing in-memory limiter (fail-open to
  memory, never block auth on a Redis hiccup).
- Update `rate-limit.test.ts` to `await` and add a Redis-mocked case.

---

## D2. Prisma migrations instead of `db push`

**State:** schema is applied with `prisma db push` (dev + `docker-compose` init).
No `prisma/migrations/` history → no review/rollback of schema changes.

**Why not done now:** **Codex owns the Docker/deploy setup** and its
`docker-compose.yml` runs `prisma db push`. Switching to `migrate deploy`
unilaterally would desync the two workflows (exactly the collision pattern we just
cleaned up). This needs to be agreed and changed in one place.

**Recommendation (safe baseline — no data loss):**
```bash
mkdir -p prisma/migrations/0_init
bunx prisma migrate diff --from-empty \
  --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql
bunx prisma migrate resolve --applied 0_init   # marks baseline applied; DB already matches
# then switch docker-compose + deploy to: prisma migrate deploy
```
Coordinate with the Docker setup so both use `migrate deploy` afterward.

---

## D3. Source of truth for assets / activities / workflow runs — RESOLVED (option B)

> **Decision taken (2026-06-14): option B.** The dead models `Asset`, `Generation`,
> `AgentRun`, `ActivityLog` were removed from `schema.prisma` (they were never
> written; the empty tables were dropped via `db push --accept-data-loss`), and the
> admin report no longer counts them. Assets/activities/run-history remain
> client-side for now; workflow metrics live in `WorkflowRun`. If collaboration /
> multi-device becomes a requirement later, revisit with option A below.

---

### (original analysis)

## D3 (analysis). Source of truth for assets / activities / workflow runs

**State:** `projects` and `listings` are server-backed (Postgres). But `assets`,
`activities`, and `workflowRuns` live only in the browser (`dashboard-store`
localStorage). Separately, four Prisma models — `Asset`, `Generation`, `AgentRun`,
`ActivityLog` — are **defined but never written** (the admin report even counts
`Generation`/`ActivityLog`, so those numbers are always 0).

**This is a product call, not a pure bug.** Two coherent directions:

- **A — Make them real (multi-device / teammates).** Persist assets/activities/
  runs server-side like projects/listings: write the existing models, load them on
  bootstrap, and have the admin report read real counts. Larger effort; needed if
  workspaces are meant to be collaborative or usable across devices.
- **B — Own "client-only" explicitly.** Delete the dead models from
  `schema.prisma`, remove their counts from `admin/status`, and document that
  assets/activities/runs are per-browser. Smaller; honest about current behavior.
  (Dropping the empty tables via `db push` is safe — they hold no rows.)

**Recommendation:** pick **A** if collaboration/multi-device matters (it's implied
by the multi-member `OrganizationMember` model), otherwise **B** to stop implying
persistence that doesn't exist. Either way, the admin report should not count
models that are never written.

---

## Note on coordination

The Claude and Codex sessions share one working directory, which caused the
earlier edit collisions. D1–D3 in particular touch areas (deploy/Docker, schema
strategy, data model) where a shared decision avoids re-introducing that churn.
