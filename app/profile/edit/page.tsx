import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { getUserInterestSlugs } from "@/lib/interests";
import { EditProfileForm } from "@/components/edit-profile-form";

export const metadata: Metadata = {
  title: "Edit profile",
  description: "Update your name, bio and profile photo.",
};

export default async function EditProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/profile/edit");

  const [user, interests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true, bio: true },
    }),
    getUserInterestSlugs(userId),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
        <p className="text-sm text-muted-foreground">
          Update how you appear across Inday.
        </p>
      </div>
      <EditProfileForm initial={{ ...user, interests }} />
    </div>
  );
}
