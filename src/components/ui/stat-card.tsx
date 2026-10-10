import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "brand" | "sky" | "emerald" | "amber" | "rose" | "slate";
  className?: string;
}

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({ label, value, hint, icon: Icon, tone = "brand", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
        {hint ? <p className="mt-1 text-xs text-ink-soft">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
    </div>
  );
}
