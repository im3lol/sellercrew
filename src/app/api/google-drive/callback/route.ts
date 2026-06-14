import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  encryptGoogleToken,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  verifyGoogleOAuthState,
} from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  const session = getSession(request);
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("sellercrew_google_oauth_state")?.value;
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const redirect = new URL("/", request.url);

  if (!session || error || !code || state !== cookieState || !verifyGoogleOAuthState(state, session.uid)) {
    redirect.searchParams.set("googleDrive", error || "connection-failed");
    return NextResponse.redirect(redirect);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const existing = await db.googleDriveConnection.findUnique({ where: { userId: session.uid } });
    const refreshToken = tokens.refresh_token
      ? encryptGoogleToken(tokens.refresh_token)
      : existing?.encryptedRefreshToken;
    if (!refreshToken) throw new Error("Google did not return a refresh token. Reconnect and approve access.");

    const profile = await getGoogleUserInfo(tokens.access_token);
    await db.googleDriveConnection.upsert({
      where: { userId: session.uid },
      create: {
        userId: session.uid,
        googleEmail: profile.email ?? session.email,
        encryptedRefreshToken: refreshToken,
        scope: tokens.scope || "",
      },
      update: {
        googleEmail: profile.email ?? session.email,
        encryptedRefreshToken: refreshToken,
        scope: tokens.scope || existing?.scope || "",
      },
    });
    redirect.searchParams.set("googleDrive", "connected");
  } catch {
    redirect.searchParams.set("googleDrive", "connection-failed");
  }
  const response = NextResponse.redirect(redirect);
  response.cookies.set("sellercrew_google_oauth_state", "", { path: "/", maxAge: 0 });
  return response;
}
