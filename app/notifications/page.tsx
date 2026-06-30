import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotificationList } from "@/components/notification-list";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your likes, comments, and new followers.",
};

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/notifications");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
      <NotificationList />
    </div>
  );
}
