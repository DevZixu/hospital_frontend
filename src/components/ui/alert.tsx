import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONES: Record<AlertTone, { wrapper: string; icon: typeof Info }> = {
  info: { wrapper: "bg-sky-50 text-sky-800 ring-sky-200", icon: Info },
  success: { wrapper: "bg-emerald-50 text-emerald-800 ring-emerald-200", icon: CheckCircle2 },
  warning: { wrapper: "bg-amber-50 text-amber-800 ring-amber-200", icon: AlertTriangle },
  danger: { wrapper: "bg-red-50 text-red-800 ring-red-200", icon: XCircle },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrapper, icon: Icon } = TONES[tone];
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset", wrapper, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-0.5 opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
