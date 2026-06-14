import { NextResponse } from "next/server";
import { adminSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie.name, "", adminSessionCookie.clearedOptions);
  return response;
}
