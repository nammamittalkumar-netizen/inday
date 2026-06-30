import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "@/components/signup-form";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Inday account to share incidents from your day.",
};

export default async function SignupPage() {
  if (await getCurrentUserId()) redirect("/");

  return (
    <AuthShell
      title="Create your account"
      description="Join Inday and share the incidents of your day."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
