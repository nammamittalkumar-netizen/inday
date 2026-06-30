"use client";

import * as React from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** A labelled input with a leading icon and optional error/hint text. */
export function IconField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  className,
  ref,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          ref={ref}
          aria-invalid={!!error}
          className={cn("h-10 pl-9", className)}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** A password field with a leading icon and a show/hide toggle. */
export function PasswordField({
  id,
  label,
  icon: Icon,
  error,
  hint,
  className,
  ref,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          ref={ref}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          className={cn("h-10 pl-9 pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
