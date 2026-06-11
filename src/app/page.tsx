"use client";

import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthPages } from "@/components/auth/auth-pages";
import { DashboardV2 } from "@/components/dashboard/dashboard-v2";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  if (view === "landing") return <LandingPage />;
  if (view === "auth" || !isAuthenticated) return <AuthPages />;
  return <DashboardV2 />;
}
