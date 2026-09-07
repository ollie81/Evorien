import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/data/profile";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Create your Passport" };

export default async function OnboardingPage() {
  const profile = await getMyProfile();

  if (!profile) redirect("/sign-in");
  if (profile.onboarding_completed) redirect("/");

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-1 items-center px-4 py-12">
      <div className="w-full">
        <OnboardingFlow />
      </div>
    </div>
  );
}
