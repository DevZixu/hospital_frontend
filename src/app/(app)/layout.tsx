"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

/** Routes patients are NOT allowed to visit */
const PATIENT_BLOCKED_PREFIXES = [
  "/staff",
  "/patients",
  "/admissions",
  "/laboratory",
  "/pharmacy",
  "/medical-records",
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Block patients from staff-only pages
    if (
      user.role === "PATIENT" &&
      PATIENT_BLOCKED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      router.replace("/dashboard");
    }
  }, [loading, user, router, pathname]);

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
