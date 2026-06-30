import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConversationList } from "@/components/conversation-list";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your direct conversations.",
};

export default async function MessagesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/messages");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <ConversationList />
    </div>
  );
}
