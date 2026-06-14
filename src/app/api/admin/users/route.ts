import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guard";
import { hashPassword } from "@/lib/auth";
import { SUBSCRIPTION_PLANS, type PlanKey } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const planSchema = z.enum(["starter", "pro", "agency", "enterprise"]);
const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
  plan: planSchema.default("starter"),
  trialDays: z.number().int().min(0).max(365).default(14),
});
const updateSchema = z.object({
  userId: z.string().min(1),
  accountStatus: z.enum(["active", "suspended"]).optional(),
  plan: planSchema.optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
});

export async function POST(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide valid user, password, plan, and trial details." }, { status: 400 });
  }
  const { name, email, password, plan, trialDays } = parsed.data;
  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    return NextResponse.json({ error: "The administrator email cannot be used as a customer account." }, { status: 409 });
  }
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const trialEndsAt = trialDays > 0 ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null;
  const planConfig = SUBSCRIPTION_PLANS[plan];
  try {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashPassword(password),
          role: "user",
          accountStatus: "active",
          emailVerified: true,
        },
      });
      const organization = await tx.organization.create({
        data: { name: `${name}'s Workspace`, ownerId: created.id },
      });
      await tx.organizationMember.create({
        data: { organizationId: organization.id, userId: created.id, role: "owner" },
      });
      await tx.credit.create({
        data: {
          organizationId: organization.id,
          balance: planConfig.credits < 0 ? 999_999_999 : planConfig.credits,
          used: 0,
        },
      });
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          plan,
          status: trialDays > 0 ? "trialing" : "active",
          trialEndsAt,
        },
      });
      return created;
    });
    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Could not create the user." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length < 2) {
    return NextResponse.json({ error: "Provide a valid account change." }, { status: 400 });
  }
  const { userId, accountStatus, plan, trialDays } = parsed.data;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      memberships: {
        orderBy: { joinedAt: "asc" },
        take: 1,
        select: { organizationId: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const organizationId = user.memberships[0]?.organizationId;
  await db.$transaction(async (tx) => {
    if (accountStatus) {
      await tx.user.update({
        where: { id: userId },
        data: {
          accountStatus,
          suspendedAt: accountStatus === "suspended" ? new Date() : null,
        },
      });
    }
    if (organizationId && (plan || trialDays !== undefined)) {
      const current = await tx.subscription.findUnique({ where: { organizationId } });
      const nextPlan = (plan ?? current?.plan ?? "starter") as PlanKey;
      const trialEndsAt = trialDays !== undefined
        ? trialDays > 0
          ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
          : null
        : current?.trialEndsAt;
      await tx.subscription.upsert({
        where: { organizationId },
        update: {
          ...(plan ? { plan } : {}),
          ...(trialDays !== undefined ? { trialEndsAt, status: trialDays > 0 ? "trialing" : "active" } : {}),
        },
        create: {
          organizationId,
          plan: nextPlan,
          status: trialDays && trialDays > 0 ? "trialing" : "active",
          trialEndsAt,
        },
      });
      if (plan) {
        const credits = SUBSCRIPTION_PLANS[plan].credits;
        await tx.credit.upsert({
          where: { organizationId },
          update: { balance: credits < 0 ? 999_999_999 : credits },
          create: { organizationId, balance: credits < 0 ? 999_999_999 : credits, used: 0 },
        });
      }
    }
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const userId = request.nextUrl.searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await db.$transaction(async (tx) => {
    await tx.organization.deleteMany({ where: { ownerId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });
  return NextResponse.json({ success: true });
}
