# SellerCrew Workflow — Performance & Accuracy Improvement Plan

Date: 2026-06-18. Goal: make the multi-agent full-listing workflow **faster, more
robust, and more accurate**, while keeping (and enriching) the specialized-agent design.

## Baseline (measured from the code)
- **Critical path:** ~13–15 sequential model hops. Order: `ali → saleem-gate → noor →
  [raed‖fares] → hakim → [bayan‖rayan] → [nadeem‖adam] → 4–6 images (SERIAL) → badr →
  saleem-final → ali-final`.
- **Per-call timeout 110s**, nested fallbacks (OpenRouter sub-chain ×3 + Anthropic +
  Gemini) → worst case ~9 min for ONE agent call.
- OpenRouter (default primary) is **buffered, no provider routing, no streaming**.
- Context **accumulates**: every agent receives all prior agents' full `output`.
- Free models are slow (~31 tok/s) and rate-limited — the dominant latency factor.
- `maxTokens` is binary (2,500 / 8,000-final); OpenRouter hard-caps at 2,000.
- JSON is parsed-from-text with silent local repair (can mask truncation).

Each phase ships as its own branch → PR → Docker rebuild → verify. Add per-agent
timing to `WorkflowRun` early so improvements are measurable.

---

## Phase 1 — Provider/latency quick wins  (biggest speed-up per hour of work)
Files: `src/lib/ai/providers.ts`, `src/lib/ai/image-generation.ts`,
`src/lib/workflow-runner.ts`, `src/lib/settings.ts`

| # | Task | Where | Risk |
|---|------|-------|------|
| 1.1 | **Parallelize image generation** — replace the serial `for` loop with `Promise.all` (bounded, e.g. 3 at a time). | workflow-runner.ts image loop | low |
| 1.2 | **Bound latency** — drop per-call timeout 110s → ~30s for free models (configurable), and add an **overall deadline** per agent + per workflow so a stuck chain fails fast. | providers.ts (AbortSignal), generateAIText | med (tune values) |
| 1.3 | **OpenRouter streaming** — send `stream:true` + parse SSE (like Anthropic/Gemini) so `onTextDelta` works and TTFT drops. | providers.ts OpenRouter | med |
| 1.4 | **OpenRouter provider routing** — add `provider: { sort: "throughput" }` to route to the fastest upstream. | providers.ts OpenRouter body | low |
| 1.5 | **Retry on 429/503 with short backoff** once before falling through (free models rate-limit constantly). | providers.ts openrouter sub-chain | low |
| 1.6 | **Per-agent maxTokens** — size output budget to each agent instead of fixed 2,500 (e.g. gate ~400, copy ~3,000). | runAgent + a per-agent map | low |
| 1.7 | **Stop re-sending base64 images** to non-vision fallback models / on every retry. | providers.ts image blocks | low |

**Expected:** removes the multi-minute hangs; image step no longer serial; faster
TTFT. Verify with a timed live run (before/after) + typecheck/test/build.

---

## Phase 2 — Architecture: parallel DAG (the multi-agent restructure)
Files: `src/lib/workflow-runner.ts`, `src/lib/workflow.ts`

Restructure the linear chain into **dependency waves** so independent agents run together:

```
Wave 0:  blocked-terms gate (no AI) + ali-intake
Wave 1:  ⫷ Noor(image) ‖ Raed(keywords) ‖ Fares(market) ‖ Saleem-gate(compliance) ⫸
Wave 2:  Hakim(strategy)
Wave 3:  ⫷ Bayan(copy) ‖ Nadeem(SEO) ‖ Rayan(creative) ⫸
Wave 4:  ⫷ Adam images (all parallel) ‖ Badr(review) ‖ Saleem-final(compliance) ⫸
Wave 5:  Ali(final assembly)
```
- **Critical path: ~14 → ~6 hops** → ~2–2.5× faster from restructuring alone.
- **2.1** Implement the waves (`Promise.all` per wave; gate can still hard-stop).
- **2.2 Trim context handoff** — pass each agent a **curated handoff** (the specific
  upstream summaries/fields it needs) instead of every prior `output`. Big prompt-size
  cut on the late agents.
- **2.3 (optional) Finer specialists, in parallel** — split copy into
  `Title ‖ Bullets ‖ Description ‖ A+` specialists running together: more agents +
  higher quality **without** deepening the critical path.

**Risk:** medium — reordering changes data dependencies; keep the gate/refund logic and
the evidence-lock intact; verify the final schema still assembles. Add tests for the
wave outputs.

---

## Phase 3 — Accuracy & robustness
Files: `src/lib/ai/providers.ts`, `src/lib/workflow-runner.ts`, `src/lib/workflow.ts`

| # | Task | Why |
|---|------|-----|
| 3.1 | **Structured outputs via tool/function calling** (provider-native JSON) with the current parse-from-text as fallback for models without tools. | Biggest accuracy win — near-eliminates malformed JSON |
| 3.2 | **Surface truncation** — when `repairTruncatedJson` actually had to close brackets, retry once with a higher token budget instead of silently accepting an incomplete result. | Stops shipping cut-off output as valid |
| 3.3 | **Strengthen Badr (critic)** — adversarial check of each factual claim against the evidence-lock; flag/reject unsupported claims, hallucinations, banned terms. | Quality gate |
| 3.4 | **Right-size token budgets** per agent (with 1.6) so nothing truncates. | Fewer repairs/failures |

**Risk:** low–medium. Tool-calling differs per provider — implement per provider with a
clean fallback. Verify outputs still validate against `fullWorkflowResultSchema`.

---

## Phase 4 — Model strategy (the biggest quality/speed lever)
Files: `src/lib/settings.ts`, `src/lib/ai/providers.ts`, admin settings UI

| # | Task | Why |
|---|------|-----|
| 4.1 | **Per-agent model tiering** — a `models.byAgent` map: fast/cheap model for light agents (intake, keywords, SEO), strong model for critical ones (copy, final compliance). Admin-configurable. | Spend quality where it matters; speed elsewhere |
| 4.2 | **Anthropic prompt caching** (`cache_control` on the system prompt) — cut repeated context billing/latency. | Cheaper + faster on Anthropic |
| 4.3 | **Recommend a fast paid default with free fallback**, documented cost-per-run. Free stays available for testing. | The real fix for the "slow + weak" free models |
| 4.4 | **Admin UI** — expose per-agent model + the routing/timeout/streaming knobs. | Operability |

**Risk:** low (config-level), but 4.1 touches runAgent model selection + settings schema.

---

## Sequencing & rollout
1. **Phase 1** first — safe, immediate, unblocks the "too slow / hangs" pain.
2. **Phase 2** — the structural 2–2.5× win.
3. **Phase 3** — accuracy, once it's fast.
4. **Phase 4** — model tiering + caching for the final quality jump.

Cross-cutting first step: **instrument per-agent timing** (`WorkflowRun` already has
`durationMs`; add per-step ms) so each phase's gain is measured, not guessed.

Every phase: typecheck + 53 tests + production build + one timed Docker run, then PR +
merge + rebuild.
