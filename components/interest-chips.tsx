"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { INTEREST_CATALOG } from "@/lib/interest-catalog";

type Props = {
  /** Currently selected interest slugs. */
  selected: string[];
  /** Toggle a slug on/off. */
  onToggle: (slug: string) => void;
  disabled?: boolean;
};

/** A grid of toggleable interest chips backed by the fixed catalog. */
export function InterestChips({ selected, onToggle, disabled }: Props) {
  const set = new Set(selected);
  return (
    <div className="flex flex-wrap gap-2">
      {INTEREST_CATALOG.map(({ slug, label }) => {
        const active = set.has(slug);
        return (
          <button
            key={slug}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            onClick={() => onToggle(slug)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {active && <Check className="size-3.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
