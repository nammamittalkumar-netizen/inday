import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreatePostForm } from "@/components/create-post-form";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "New post",
  description: "Share an incident from your day.",
};

export default async function NewPostPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/new");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New incident</h1>
        <p className="text-sm text-muted-foreground">
          What happened today? Keep it under 500 characters.
        </p>
      </div>
      <CreatePostForm />
    </div>
  );
}
