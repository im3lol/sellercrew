import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, sessionCookie, verifyPassword } from "@/lib/auth";
import { loadAccount } from "@/lib/account";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(`login:${clientIp(request)}`, 20, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Per-account limit so a single target can't be brute-forced from rotating IPs.
  const perAccount = rateLimit(`login:acct:${email}`, 10, 15 * 60 * 1000);
  if (!perAccount.ok) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${perAccount.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.accountStatus !== "active" || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const account = await loadAccount(user.id);
  if (!account) {
    return NextResponse.json({ error: "Could not load your account. Please try again." }, { status: 500 });
  }

  const response = NextResponse.json(account);
  response.cookies.set(
    sessionCookie.name,
    createSessionToken({ id: account.user.id, email: account.user.email }),
    sessionCookie.options
  );
  return response;
}
