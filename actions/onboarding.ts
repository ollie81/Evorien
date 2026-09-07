"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OnboardingFormState = { error?: string } | undefined;

export async function completeOnboardingAction(
  _prevState: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const userId = await requireUserId();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const contributionSummary = String(formData.get("contributionSummary") ?? "").trim();
  const lookingFor = String(formData.get("lookingFor") ?? "").trim();
  const roles = formData.getAll("roles").map(String);
  const pillars = formData.getAll("pillars").map(String);

  if (!fullName || usernameRaw.length < 3) {
    return { error: "Enter your name and a username of at least 3 characters." };
  }
  if (pillars.length === 0) {
    return { error: "Choose at least one pillar." };
  }
  if (roles.length === 0) {
    return { error: "Choose at least one role." };
  }

  const username = usernameRaw.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      full_name: fullName,
      country: country || null,
      roles,
      pillars,
      contribution_summary: contributionSummary || null,
      looking_for: lookingFor || null,
      onboarding_completed: true,
    })
    .eq("id", userId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That username is already taken — please choose another."
          : "Something went wrong creating your Passport. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
