"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  const userName = user?.staff
    ? `${user.staff.firstName} ${user.staff.lastName}`
    : user?.patient
      ? `${user.patient.firstName} ${user.patient.lastName}`
      : (user?.email ?? "Account");

  return (
    <div className="min-h-screen">
      <Sidebar user={user} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:pl-64">
        <Topbar userName={userName} onOpenNav={() => setNavOpen(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
