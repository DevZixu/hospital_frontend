import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const BASE =
  "w-full rounded-lg border border-line bg-white px-3 text-sm text-ink shadow-sm transition placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        BASE,
        "h-10",
        invalid && "border-red-300 focus:border-red-400 focus:ring-red-100",
        className,
      )}
      {...props}
    />
  );
});
