"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { navForRole } from "@/lib/constants";
import { roleLabel } from "@/lib/format";
import type { User } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";

export function Sidebar({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = navForRole(user?.role);

  const displayName = user?.staff
    ? `${user.staff.firstName} ${user.staff.lastName}`
    : user?.patient
      ? `${user.patient.firstName} ${user.patient.lastName}`
      : (user?.email ?? "Account");

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Activity className="h-4.5 w-4.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold text-ink">Aster Health</span>
              <span className="block text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                Care Operations
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-faint hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-soft hover:bg-slate-100 hover:text-ink",
                )}
              >
                <Icon className={cn("h-4.5 w-4.5", active ? "text-brand-600" : "text-ink-faint")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar name={displayName} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{displayName}</p>
              <p className="truncate text-xs text-ink-faint">{roleLabel(user?.role)}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
