"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateSkillId } from "@/lib/skills";

export type UpdateProfileFormState = { error?: string } | undefined;

export async function updateProfileAction(
  _prevState: UpdateProfileFormState,
  formData: FormData
): Promise<UpdateProfileFormState> {
  const userId = await requireUserId();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const bio = String(formData.get("bio") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const contributionSummary = String(formData.get("contributionSummary") ?? "").trim();
  const lookingFor = String(formData.get("lookingFor") ?? "").trim();
  const roles = formData.getAll("roles").map(String);
  const pillars = formData.getAll("pillars").map(String);

  if (!fullName || username.length < 3) {
    return { error: "Enter your name and a username of at least 3 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      username,
      bio: bio || null,
      country: country || null,
      city: city || null,
      website: website || null,
      contribution_summary: contributionSummary || null,
      looking_for: lookingFor || null,
      roles,
      pillars,
    })
    .eq("id", userId);

  if (error) {
    return {
      error: error.code === "23505" ? "That username is already taken." : "Could not save changes.",
    };
  }

  revalidatePath("/passport");
  redirect("/passport");
}

export type AddSkillFormState = { error?: string } | undefined;

export async function addSkillAction(
  _prevState: AddSkillFormState,
  formData: FormData
): Promise<AddSkillFormState> {
  const userId = await requireUserId();
  const name = String(formData.get("skillName") ?? "").trim();
  if (!name) return undefined;

  const supabase = await createClient();

  const skillId = await getOrCreateSkillId(supabase, name);
  if (!skillId) return { error: "Could not add that skill." };

  const { error } = await supabase
    .from("profile_skills")
    .upsert({ profile_id: userId, skill_id: skillId }, { onConflict: "profile_id,skill_id" });

  if (error) return { error: "Could not add that skill." };

  revalidatePath("/passport/edit");
  revalidatePath("/passport");
  return undefined;
}

export async function removeSkillAction(profileSkillId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("id", profileSkillId)
    .eq("profile_id", userId);

  if (error) throw new Error("Could not remove this skill.");

  revalidatePath("/passport/edit");
  revalidatePath("/passport");
}
