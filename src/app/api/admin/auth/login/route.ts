import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminSessionCookie,
  createAdminSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const limited = await rateLimit(`admin-login:${clientIp(request)}`, 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredHash = process.env.ADMIN_PASSWORD_HASH_B64
    ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8")
    : process.env.ADMIN_PASSWORD_HASH;
  const valid =
    Boolean(configuredEmail && configuredHash) &&
    parsed.data.email === configuredEmail &&
    verifyPassword(parsed.data.password, configuredHash);

  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true, email: configuredEmail });
  response.cookies.set(
    adminSessionCookie.name,
    createAdminSessionToken(configuredEmail!),
    adminSessionCookie.options
  );
  return response;
}
