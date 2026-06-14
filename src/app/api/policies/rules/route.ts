import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  id: z.string().min(1),
  // "keep" reactivates a flagged duplicate; "archive" retires a rule.
  action: z.enum(["keep", "archive", "activate"]),
});

// PATCH — resolve a flagged duplicate or change a rule's status (admin only).
export async function PATCH(request: NextRequest) {
  const access = await requireAdmin(request);
  if (!access.ok) return access.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a rule id and a valid action." }, { status: 400 });
  }

  const { id, action } = parsed.data;
  const status = action === "archive" ? "archived" : "active";

  try {
    await db.policyRule.update({
      where: { id },
      data: {
        status,
        ...(status === "active" ? { duplicateOfId: null, note: null } : {}),
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Rule not found." }, { status: 404 });
  }
}
