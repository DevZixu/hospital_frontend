"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-ink-faint">
        <span className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-brand-600 text-white">
          <Activity className="h-5 w-5" />
        </span>
        <p className="text-sm">Loading workspace…</p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
