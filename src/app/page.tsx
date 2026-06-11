"use client";

import { useAppStore } from "@/lib/store";
import { LandingPage } from "@/components/landing/landing-page";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function Home() {
  const view = useAppStore((s) => s.view);

  return view === "landing" ? <LandingPage /> : <Dashboard />;
}
