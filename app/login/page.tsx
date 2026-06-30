import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Inday to post, like, and comment.",
};

export default async function LoginPage() {
  if (await getCurrentUserId()) redirect("/");

  return (
    <AuthShell
      title="Welcome back"
      description="Log in to your Inday account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
