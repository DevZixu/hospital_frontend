"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

export function Topbar({ userName, onOpenNav }: { userName: string; onOpenNav: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        className="rounded-lg p-2 text-ink-soft hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <Input placeholder="Search patients, records…" className="pl-9" disabled />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="relative rounded-lg p-2 text-ink-soft hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition hover:bg-slate-100"
          >
            <Avatar name={userName} className="h-8 w-8" />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-ink">{userName}</span>
              <span className="block text-xs text-ink-faint">{roleLabel(user?.role)}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-faint" />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-raised">
              <div className="border-b border-line px-4 py-3">
                <p className="text-sm font-medium text-ink">{userName}</p>
                <p className="truncate text-xs text-ink-faint">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-soft hover:bg-slate-100 hover:text-ink"
                >
                  <UserRound className="h-4 w-4" />
                  My profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
