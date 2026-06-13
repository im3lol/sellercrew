import { db } from "@/lib/db";

export interface AccountWorkspace {
  id: string;
  name: string;
  role: string;
  plan: string;
  credits: { balance: number; used: number };
}

export interface AccountContext {
  user: { id: string; email: string; name: string; avatar: string | null; role: string };
  workspace: AccountWorkspace | null;
}

/**
 * Load the authenticated user's identity plus their primary workspace
 * (organization), subscription plan, and credit balance.
 */
export async function loadAccount(userId: string): Promise<AccountContext | null> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const membership = await db.organizationMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    include: { organization: { include: { credits: true, subscription: true } } },
  });

  const org = membership?.organization ?? null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email,
      avatar: user.avatar ?? null,
      role: user.role,
    },
    workspace: org
      ? {
          id: org.id,
          name: org.name,
          role: membership?.role ?? "member",
          plan: org.subscription?.plan ?? "starter",
          credits: { balance: org.credits?.balance ?? 0, used: org.credits?.used ?? 0 },
        }
      : null,
  };
}
