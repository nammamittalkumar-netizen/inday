import { BrandLogo } from "@/components/brand-logo";

/**
 * Modern, centered auth layout: a soft gradient glow behind an elevated card,
 * topped with the Inday brand mark. Used by the login and signup pages.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex max-w-sm flex-col items-center py-10">
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 -z-10 h-64 w-[28rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/30 via-rose-500/20 to-transparent blur-3xl"
      />

      {/* Brand mark — same Inday logo as the navbar */}
      <BrandLogo
        className="mb-6"
        iconClassName="size-9 rounded-xl text-base shadow-sm"
        textClassName="text-xl font-bold"
      />

      <div className="w-full rounded-3xl border border-border bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur-sm sm:p-8">
        <div className="mb-6 space-y-1.5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>

      {footer && (
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      )}
    </div>
  );
}
