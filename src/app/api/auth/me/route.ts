import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { loadAccount } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const account = await loadAccount(session.uid);
  if (!account) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, ...account });
}
