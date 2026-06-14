"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

// Bridges a Clerk (Google) session into a SellerCrew app session. Mounted once,
// globally, inside ClerkProvider — so after the OAuth redirect it runs no matter
// which view the user lands on (landing, auth, etc.). It waits for bootstrap()
// to finish (authChecked) so it doesn't race the cookie-based /api/auth/me check,
// and only syncs when Clerk is signed in but the app session is not.
export function ClerkSessionSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const authChecked = useAppStore((s) => s.authChecked);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const applyAccount = useAppStore((s) => s.applyAccount);
  const syncing = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !authChecked || isAuthenticated || syncing.current) return;
    syncing.current = true;
    fetch("/api/auth/clerk-sync", { method: "POST", credentials: "include" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Could not finish Google sign-in.");
        applyAccount(data);
      })
      .catch((error) => {
        syncing.current = false;
        toast.error(error instanceof Error ? error.message : "Could not finish Google sign-in.");
      });
  }, [isLoaded, isSignedIn, authChecked, isAuthenticated, applyAccount]);

  return null;
}
