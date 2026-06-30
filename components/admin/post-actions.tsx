"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

export function PostActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (
      !confirm(
        "Delete this post? Its comments and likes will be removed too. This cannot be undone.",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      await apiFetch(`/api/admin/posts/${postId}`, { method: "DELETE" });
      toast.success("Post deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete post");
      setPending(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={remove}
      aria-label="Delete post"
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
