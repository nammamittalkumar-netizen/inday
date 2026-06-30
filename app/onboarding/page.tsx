import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingInterests } from "@/components/onboarding-interests";
import { getCurrentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Choose your interests",
  description: "Tell us what you're into so we can suggest people to follow.",
};

export default async function OnboardingPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?callbackUrl=/onboarding");

  return <OnboardingInterests />;
}
