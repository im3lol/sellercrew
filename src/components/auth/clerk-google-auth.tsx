"use client";

import { useState } from "react";
import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function clerkErrorMessage(error: unknown, fallback: string): string {
  const clerkError = error as { errors?: Array<{ message?: string; longMessage?: string }> };
  return (
    clerkError?.errors?.[0]?.longMessage ||
    clerkError?.errors?.[0]?.message ||
    (error instanceof Error ? error.message : fallback)
  );
}

function ClerkGoogleAuthEnabled({ mode }: { mode: "sign-in" | "sign-up" }) {
  // isSignedIn only drives the button label here; turning a Clerk session into a
  // SellerCrew session is handled globally by <ClerkSessionSync> so it runs no
  // matter which view the OAuth redirect lands on.
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [redirecting, setRedirecting] = useState(false);

  const continueWithGoogle = async () => {
    if (redirecting) return;
    setRedirecting(true);
    try {
      // Clerk's "future" SSO API (what useSignIn/useSignUp expose in this version):
      // redirectUrl = where to land once SSO completes; redirectCallbackUrl = the
      // route that finishes the OAuth handshake (/sso-callback).
      const params = {
        strategy: "oauth_google",
        redirectUrl: "/",
        redirectCallbackUrl: "/sso-callback",
      } as const;

      if (mode === "sign-up") {
        if (!signUp) throw new Error("Google sign-in is still loading. Please try again.");
        await signUp.sso(params);
      } else {
        if (!signIn) throw new Error("Google sign-in is still loading. Please try again.");
        await signIn.sso(params);
      }
      // On success the browser redirects away; nothing else to do here.
    } catch (error) {
      setRedirecting(false);
      toast.error(clerkErrorMessage(error, "Could not start Google sign-in."));
    }
  };

  return (
    <div>
      {isSignedIn ? (
        <Button variant="outline" className="h-12 w-full rounded-xl" disabled>
          Connected to Google
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full rounded-xl border-slate-200 bg-white text-[15px] font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={continueWithGoogle}
          disabled={!isLoaded || redirecting}
        >
          {redirecting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.35Z" fill="#4285F4" />
              <path d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.51c-.9.6-2.03.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.58A10 10 0 0 0 12 22Z" fill="#34A853" />
              <path d="M6.4 13.91A6.02 6.02 0 0 1 6.09 12c0-.66.11-1.3.31-1.91V7.51H3.05A10 10 0 0 0 2 12c0 1.61.39 3.14 1.05 4.49l3.35-2.58Z" fill="#FBBC05" />
              <path d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.51L6.4 10.1A5.98 5.98 0 0 1 12 5.97Z" fill="#EA4335" />
            </svg>
          )}
          {redirecting ? "Opening Google..." : "Continue with Google"}
        </Button>
      )}
    </div>
  );
}

export function ClerkGoogleAuth({ mode = "sign-in" }: { mode?: "sign-in" | "sign-up" }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Google sign-in needs Clerk keys
      </Button>
    );
  }
  return <ClerkGoogleAuthEnabled mode={mode} />;
}
