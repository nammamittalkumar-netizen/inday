"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={logout} disabled={pending}>
      <LogOut className="size-4" />
      {pending ? "Logging out…" : "Log out"}
    </Button>
  );
}

export function DeleteAccountButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (
      !confirm(
        "Delete your account permanently? All your posts, comments and likes will be removed. This cannot be undone.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      await apiFetch("/api/account", { method: "DELETE" });
      await signOut({ redirect: false });
      toast.success("Your account has been deleted");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete account");
      setPending(false);
    }
  }

  return (
    <Button variant="destructive" onClick={remove} disabled={pending}>
      <Trash2 className="size-4" />
      {pending ? "Deleting…" : "Delete account"}
    </Button>
  );
}
