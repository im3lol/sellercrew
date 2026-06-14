import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { loadAccount } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  workspaceName: z.string().trim().min(2).max(100).optional(),
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Object.keys(parsed.data).length) {
    return NextResponse.json({ error: "Provide valid account changes." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: session.uid } });
  if (!user || user.accountStatus !== "active") {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword || !verifyPassword(parsed.data.currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }

  // Renaming the workspace is an owner/admin action.
  if (parsed.data.workspaceName) {
    const membership = await db.organizationMember.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: "asc" },
      select: { role: true },
    });
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Only the workspace owner or an admin can rename the workspace." },
        { status: 403 }
      );
    }
  }

  await db.$transaction(async (tx) => {
    if (parsed.data.name || parsed.data.newPassword) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          ...(parsed.data.name ? { name: parsed.data.name } : {}),
          ...(parsed.data.newPassword ? { passwordHash: hashPassword(parsed.data.newPassword) } : {}),
        },
      });
    }

    if (parsed.data.workspaceName) {
      const membership = await tx.organizationMember.findFirst({
        where: { userId: user.id },
        orderBy: { joinedAt: "asc" },
      });
      if (membership) {
        await tx.organization.update({
          where: { id: membership.organizationId },
          data: { name: parsed.data.workspaceName },
        });
      }
    }
  });

  const account = await loadAccount(user.id);
  return NextResponse.json(account);
}
