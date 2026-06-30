"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  /** Path to share, e.g. "/profile/abc" or "/post/abc". */
  path: string;
  label?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "icon-sm";
};

/** Copies an absolute link to the clipboard (with a Web Share fallback). */
export function ShareButton({
  path,
  label = "Share",
  variant = "outline",
  size = "sm",
}: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url =
      typeof window !== "undefined" ? window.location.origin + path : path;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // User dismissed the share sheet, or clipboard was blocked — ignore.
    }
  }

  const iconOnly = size === "icon-sm";

  return (
    <Button onClick={share} variant={variant} size={size} aria-label={label}>
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {iconOnly ? null : copied ? "Copied" : label}
    </Button>
  );
}
