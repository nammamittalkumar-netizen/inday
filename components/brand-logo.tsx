import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * The Inday brand mark — the "I" chip plus wordmark, as used in the navbar.
 * Reused across the navbar, auth pages, and anywhere else the logo appears so
 * there's a single source of truth. Pass `iconClassName` / `textClassName` to
 * resize for a given spot; `showText={false}` for the icon alone.
 */
export function BrandLogo({
  href = "/",
  showText = true,
  className,
  iconClassName,
  textClassName,
}: {
  href?: string;
  showText?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Inday home"
      className={cn("flex items-center gap-2 font-semibold", className)}
    >
      <span
        className={cn(
          "grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground",
          iconClassName,
        )}
      >
        I
      </span>
      {showText && (
        <span className={cn("text-lg tracking-tight", textClassName)}>Inday</span>
      )}
    </Link>
  );
}
