import { db } from "@/lib/db";

export interface CreditCharge {
  charged: boolean;
  creditId: string | null;
}

const NO_CHARGE: CreditCharge = { charged: false, creditId: null };

/**
 * Atomically reserve+deduct `cost` credits from the user's primary workspace
 * before running paid work. The deduction is a single conditional UPDATE
 * (balance >= cost), so concurrent requests can't overspend.
 *
 * - No workspace/credit row, or unlimited balance (< 0): allowed, not charged.
 * - Insufficient balance: { ok: false } with the current balance.
 */
export async function chargeCredits(
  userId: string,
  cost: number
): Promise<{ ok: true; charge: CreditCharge } | { ok: false; balance: number }> {
  const membership = await db.organizationMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    select: { organizationId: true },
  });
  if (!membership) return { ok: true, charge: NO_CHARGE };

  const credit = await db.credit.findUnique({
    where: { organizationId: membership.organizationId },
    select: { id: true, balance: true },
  });
  if (!credit) return { ok: true, charge: NO_CHARGE };
  if (credit.balance < 0) return { ok: true, charge: { charged: false, creditId: credit.id } }; // unlimited

  const result = await db.credit.updateMany({
    where: { id: credit.id, balance: { gte: cost } },
    data: { balance: { decrement: cost }, used: { increment: cost } },
  });
  if (result.count === 0) return { ok: false, balance: credit.balance };

  return { ok: true, charge: { charged: true, creditId: credit.id } };
}

/**
 * Reverse a previous charge (e.g. the workflow was blocked or failed). Single-shot:
 * the passed charge is marked spent before the update, so calling this twice with
 * the same charge object (or from two error paths) can't double-refund or drive
 * `used` negative.
 */
export async function refundCredits(charge: CreditCharge, cost: number): Promise<void> {
  if (!charge.charged || !charge.creditId) return;
  const creditId = charge.creditId;
  charge.charged = false; // mark spent up-front so a second call is a no-op
  try {
    await db.credit.update({
      where: { id: creditId },
      data: { balance: { increment: cost }, used: { decrement: cost } },
    });
  } catch {
    // Best-effort refund.
  }
}

/**
 * Refund a charge identified only by its creditId (used by the worker reaper for
 * jobs whose process died before they could refund themselves). Idempotency is
 * the caller's responsibility (guard on a persisted `refunded` flag).
 */
export async function refundByCreditId(creditId: string, cost: number): Promise<void> {
  try {
    await db.credit.update({
      where: { id: creditId },
      data: { balance: { increment: cost }, used: { decrement: cost } },
    });
  } catch {
    // Best-effort refund.
  }
}
