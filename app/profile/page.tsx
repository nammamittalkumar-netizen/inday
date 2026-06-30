import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/lib/session";

export default async function MyProfileRedirect() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/profile");
  redirect(`/profile/${userId}`);
}
