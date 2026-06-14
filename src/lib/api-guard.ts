import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getSession, type AdminSessionPayload, type SessionPayload } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getPrimaryOrgId } from "@/lib/account";
import { db } from "@/lib/db";

export type GuardResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export type OrgGuardResult =
  | { ok: true; session: SessionPayload; organizationId: string }
  | { ok: false; response: NextResponse };

export type AdminGuardResult =
  | { ok: true; session: AdminSessionPayload }
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
export async function guard(request: NextRequest, options: GuardOptions): Promise<GuardResult> {
  const session = getSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Please sign in to continue." }, { status: 401 }),
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.uid },
    select: { accountStatus: true },
  });
  if (user?.accountStatus !== "active") {
    return {
      ok: false,
      response: NextResponse.json({ error: "This account is suspended." }, { status: 403 }),
    };
  }

  const result = await rateLimit(`${options.scope}:${session.uid}`, options.limit, options.windowMs);
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

/**
 * Like `guard`, but also resolves the caller's primary workspace. Replaces the
 * per-route `resolveOrg` helpers and adds the rate limiting they were missing.
 */
export async function requireOrg(request: NextRequest, options: GuardOptions): Promise<OrgGuardResult> {
  const access = await guard(request, options);
  if (!access.ok) return access;
  const organizationId = await getPrimaryOrgId(access.session.uid);
  if (!organizationId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No workspace found." }, { status: 404 }),
    };
  }
  return { ok: true, session: access.session, organizationId };
}

/**
 * Require an authenticated session with the global platform admin role.
 * Workspace ownership alone does not grant access to platform administration.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminGuardResult> {
  const session = getAdminSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin sign-in is required." }, { status: 401 }),
    };
  }
  return { ok: true, session };
}
