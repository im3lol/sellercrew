import { NextRequest, NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type GuardResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

interface GuardOptions {
  scope: string;
  limit: number;
  windowMs: number;
}

/**
 * Require an authenticated session and apply a per-user rate limit.
 * Returns either the verified session or a ready-to-send error response.
 */
export function guard(request: NextRequest, options: GuardOptions): GuardResult {
  const session = getSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 }),
    };
  }

  const result = rateLimit(`${options.scope}:${session.uid}`, options.limit, options.windowMs);
  if (!result.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `You are sending requests too quickly. Try again in ${result.retryAfterSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
      ),
    };
  }

  return { ok: true, session };
}
