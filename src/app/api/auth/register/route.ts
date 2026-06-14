import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSessionToken, hashPassword, sessionCookie } from "@/lib/auth";
import { loadAccount } from "@/lib/account";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SUBSCRIPTION_PLANS } from "@/lib/credits";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const limited = await rateLimit(`register:${clientIp(request)}`, 10, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Too many sign-up attempts. Try again in ${limited.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid name, email, and a password of at least 8 characters." },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    return NextResponse.json({ error: "This email is not available." }, { status: 409 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const starterCredits = SUBSCRIPTION_PLANS.starter.credits;

  let userId: string;
  try {
    userId = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
          role: "user",
        },
      });
      const org = await tx.organization.create({
        data: { name: `${name}'s Workspace`, ownerId: user.id },
      });
      await tx.organizationMember.create({
        data: { organizationId: org.id, userId: user.id, role: "owner" },
      });
      await tx.credit.create({
        data: { organizationId: org.id, balance: starterCredits, used: 0 },
      });
      await tx.subscription.create({
        data: { organizationId: org.id, plan: "starter", status: "active" },
      });
      return user.id;
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Could not create the account. Please try again." }, { status: 500 });
  }

  const account = await loadAccount(userId);
  if (!account) {
    return NextResponse.json({ error: "Account created but could not be loaded. Please sign in." }, { status: 500 });
  }

  const response = NextResponse.json(account, { status: 201 });
  response.cookies.set(
    sessionCookie.name,
    createSessionToken({ id: account.user.id, email: account.user.email }),
    sessionCookie.options
  );
  return response;
}
