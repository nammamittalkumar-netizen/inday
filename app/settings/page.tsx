import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/change-password-form";
import {
  LogoutButton,
  DeleteAccountButton,
} from "@/components/account-actions";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Inday account.",
};

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              render={<Link href={`/profile/${user.id}`} />}
              variant="outline"
            >
              <UserIcon className="size-4" />
              View my profile
            </Button>
            <Button render={<Link href="/profile/edit" />} variant="outline">
              Edit profile
            </Button>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Danger zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Deleting your account permanently removes your profile, posts,
            comments and likes. This cannot be undone.
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
