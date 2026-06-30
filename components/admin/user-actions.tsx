"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

type Props = {
  userId: string;
  userName: string;
  role: "USER" | "ADMIN";
  /** True for the row representing the signed-in admin — actions are disabled. */
  isSelf: boolean;
};

export function UserActions({ userId, userName, role, isSelf }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setRole(next: "USER" | "ADMIN") {
    setPending(true);
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: next }),
      });
      toast.success(
        next === "ADMIN"
          ? `${userName} is now an admin`
          : `${userName} is no longer an admin`,
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update role");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (
      !confirm(
        `Delete ${userName}? All of their posts, comments, likes and messages will be permanently removed. This cannot be undone.`,
      )
    ) {
      return;
    }
    setPending(true);
    try {
      await apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      toast.success(`${userName} deleted`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete user");
      setPending(false);
    }
  }

  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  return (
    <div className="flex justify-end gap-1">
      {role === "ADMIN" ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setRole("USER")}
        >
          <ShieldOff className="size-4" />
          Demote
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => setRole("ADMIN")}
        >
          <ShieldCheck className="size-4" />
          Make admin
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={remove}
        aria-label={`Delete ${userName}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
