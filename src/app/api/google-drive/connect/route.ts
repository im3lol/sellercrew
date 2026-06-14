import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  buildGoogleAuthUrl,
  createGoogleOAuthState,
  googleDriveConfigured,
} from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.redirect(new URL("/?googleDrive=unauthorized", request.url));
  if (!(await googleDriveConfigured())) return NextResponse.redirect(new URL("/?googleDrive=not-configured", request.url));

  const state = createGoogleOAuthState(session.uid);
  const url = await buildGoogleAuthUrl(state, session.email);
  const response = NextResponse.redirect(url);
  response.cookies.set("sellercrew_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
