import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ChatThread } from "@/components/chat-thread";
import { UserAvatar } from "@/components/user-avatar";
import { getConversationMeta } from "@/lib/messages";
import { getCurrentUserId } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Chat",
};

export default async function ConversationPage({ params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/login?callbackUrl=/messages/${id}`);

  const meta = await getConversationMeta(id, userId);
  if (!meta) notFound();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link
          href={`/profile/${meta.user.id}`}
          className="flex min-w-0 items-center gap-2"
        >
          <UserAvatar
            name={meta.user.name}
            image={meta.user.image}
            className="size-9"
          />
          <span className="truncate font-semibold hover:underline">
            {meta.user.name}
          </span>
        </Link>
      </div>

      <ChatThread conversationId={id} meId={userId} otherUser={meta.user} />
    </div>
  );
}
