import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  className,
  src,
}: {
  name: string;
  className?: string;
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("h-9 w-9 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700",
        className,
      )}
      aria-hidden
    >
      {initials(name) || "?"}
    </span>
  );
}
