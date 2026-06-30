import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

import { requireAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  description: "Inday administration dashboard.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Secure gate: non-admins never see anything below this point.
  const admin = await requireAdmin();

  return (
    // Break out of the app's narrow max-w-2xl column so the dashboard gets room.
    // body has `overflow-x-clip`, so w-screen won't add a horizontal scrollbar.
    <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Shield className="size-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Admin dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage users, posts and platform activity.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-background/60 py-1 pr-3 pl-1 sm:flex">
              <UserAvatar
                name={admin.name}
                image={admin.image}
                className="size-7"
                fallbackClassName="text-xs"
              />
              <span className="text-sm font-medium">{admin.name}</span>
            </div>
            <Button render={<Link href="/" />} variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Back to app
            </Button>
          </div>
        </div>

        <AdminNav />

        {children}
      </div>
    </div>
  );
}
