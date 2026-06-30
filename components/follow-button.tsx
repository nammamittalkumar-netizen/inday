"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

type Props = {
  targetId: string;
  initialFollowing: boolean;
  onCountChange?: (followers: number) => void;
};

export function FollowButton({
  targetId,
  initialFollowing,
  onCountChange,
}: Props) {
  const router = useRouter();
  const { status } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/profile/${targetId}`);
      return;
    }
    if (pending) return;
    setPending(true);
    setFollowing((f) => !f); // optimistic
    try {
      const res = await apiFetch<{ following: boolean; followers: number }>(
        `/api/users/${targetId}/follow`,
        { method: "POST" },
      );
      setFollowing(res.following);
      onCountChange?.(res.followers);
    } catch (err) {
      setFollowing((f) => !f); // rollback
      toast.error(err instanceof ApiError ? err.message : "Couldn't update");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      onClick={toggle}
      disabled={pending}
      variant={following ? "outline" : "default"}
      size="sm"
    >
      {following ? (
        <>
          <UserCheck className="size-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="size-4" />
          Follow
        </>
      )}
    </Button>
  );
}
