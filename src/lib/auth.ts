import crypto from "crypto";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "sellercrew_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const ADMIN_SESSION_COOKIE = "sellercrew_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set to a strong value (>= 16 chars) in production.");
  }
  return "sellercrew-insecure-dev-secret-change-me";
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET must be set to a strong value (>= 32 chars) in production.");
  }
  return `${getSecret()}:sellercrew-admin`;
}

// ─── Password hashing (Node scrypt — no external dependency) ──────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, "hex");
    const derived = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ─── Session tokens (HMAC-signed, stateless) ──────────────────────────────────

export interface SessionPayload {
  uid: string;
  email: string;
  exp: number; // unix seconds
}

export function createSessionToken(user: { id: string; email: string }): string {
  const payload: SessionPayload = {
    uid: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  const provided = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (provided.length !== expectedBuf.length || !crypto.timingSafeEqual(provided, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  },
  clearedOptions: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  },
};

export function getSession(request: NextRequest): SessionPayload | null {
  return verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export interface AdminSessionPayload {
  email: string;
  kind: "admin";
  exp: number;
}

export function createAdminSessionToken(email: string): string {
  const payload: AdminSessionPayload = {
    email,
    kind: "admin",
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getAdminSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): AdminSessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", getAdminSecret()).update(body).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSessionPayload;
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (
      payload.kind !== "admin" ||
      !payload.email ||
      payload.email.toLowerCase() !== configuredEmail ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const adminSessionCookie = {
  name: ADMIN_SESSION_COOKIE,
  options: {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  },
  clearedOptions: {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  },
};

export function getAdminSession(request: NextRequest): AdminSessionPayload | null {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}
