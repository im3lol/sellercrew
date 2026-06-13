"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthPages } from "@/components/auth/auth-pages";
import { DashboardV2 } from "@/components/dashboard/dashboard-v2";

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
