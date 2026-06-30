"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

/** Opens (or starts) a DM thread with `targetId`, then routes to it. */
export function MessageButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function openChat() {
    if (pending) return;
    setPending(true);
    try {
      const res = await apiFetch<{ id: string }>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ userId: targetId }),
      });
      router.push(`/messages/${res.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't open chat");
      setPending(false);
    }
  }

  return (
    <Button onClick={openChat} disabled={pending} variant="outline" size="sm">
      <MessageCircle className="size-4" />
      Message
    </Button>
  );
}
