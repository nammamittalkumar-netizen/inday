"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InterestChips } from "@/components/interest-chips";
import { apiFetch, ApiError } from "@/lib/api-client";

const MAX_INTERESTS = 10;

/** Post-signup step: pick a few interests to seed follow suggestions. Skippable. */
export function OnboardingInterests() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length >= MAX_INTERESTS
          ? prev
          : [...prev, slug],
    );
  }

  async function save() {
    setSaving(true);
    try {
      await apiFetch("/api/profile/interests", {
        method: "PUT",
        body: JSON.stringify({ interests: selected }),
      });
      toast.success("Interests saved");
      router.push("/discover");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">What are you into?</h1>
        <p className="text-sm text-muted-foreground">
          Pick a few topics so we can suggest people to follow. You can change
          these anytime.
        </p>
      </div>

      <InterestChips selected={selected} onToggle={toggle} disabled={saving} />

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">
          {selected.length}/{MAX_INTERESTS} selected
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            disabled={saving}
          >
            Skip
          </Button>
          <Button onClick={save} disabled={saving || selected.length === 0}>
            {saving ? "Saving…" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
