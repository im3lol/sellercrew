import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { loadAccount } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Clerk authentication required." }, { status: 401 });

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (!clerkUser || !email) {
    return NextResponse.json({ error: "Google account does not expose an email address." }, { status: 400 });
  }

  // The admin email is reserved for the separate admin console, never a Google user account.
  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    return NextResponse.json({ error: "This email is not available." }, { status: 409 });
  }

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    email.split("@")[0];

  const user = await db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing) {
      return tx.user.update({
        where: { id: existing.id },
        data: { name: existing.name || displayName, avatar: clerkUser.imageUrl || existing.avatar, emailVerified: true },
      });
    }

    const created = await tx.user.create({
      data: { email, name: displayName, avatar: clerkUser.imageUrl, emailVerified: true },
    });
    const organization = await tx.organization.create({
      data: { name: `${displayName}'s Workspace`, ownerId: created.id },
    });
    await tx.organizationMember.create({
      data: { organizationId: organization.id, userId: created.id, role: "owner" },
    });
    await tx.credit.create({ data: { organizationId: organization.id, balance: 500, used: 0 } });
    await tx.subscription.create({
      data: { organizationId: organization.id, plan: "starter", status: "active" },
    });
    return created;
  });

  const account = await loadAccount(user.id);
  if (!account) return NextResponse.json({ error: "Could not load the SellerCrew account." }, { status: 500 });

  const response = NextResponse.json(account);
  response.cookies.set(sessionCookie.name, createSessionToken(user), sessionCookie.options);
  return response;
}
