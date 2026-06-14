"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/landing/landing-page";

// The auth flow and the (large) dashboard are only needed once a visitor signs
// in, so load them on demand rather than shipping them with the public landing.
const spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);
const AuthPages = dynamic(() => import("@/components/auth/auth-pages").then((m) => m.AuthPages), {
  loading: spinner,
});
const DashboardV2 = dynamic(() => import("@/components/dashboard/dashboard-v2").then((m) => m.DashboardV2), {
  loading: spinner,
});

export default function Home() {
  const view = useAppStore((s) => s.view);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authChecked = useAppStore((s) => s.authChecked);

  useEffect(() => {
    useAppStore.getState().bootstrap();
  }, []);

  if (view === "landing") return <LandingPage />;

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (view === "auth" || !isAuthenticated) return <AuthPages />;
  return <DashboardV2 />;
}
