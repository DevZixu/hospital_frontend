import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";

export const metadata: Metadata = { title: "Sign in" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-700/60" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-900/40" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Activity className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">Aster Health</span>
        </Link>
        <div className="relative max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            One workspace for every hand that cares.
          </h1>
          <p className="text-sm text-brand-100">
            Coordinate patients, appointments, admissions, records, laboratory and
            pharmacy from a single, calm operations console.
          </p>
        </div>
        <p className="relative text-xs text-brand-200">
          © {new Date().getFullYear()} Aster Health. Care Operations.
        </p>
      </div>
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
