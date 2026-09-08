import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import type { Achievement, Profile, ProfileSkill } from "@/lib/types";

/** The signed-in member's own Passport, or null if signed out. Cached per-request. */
export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getUserId();
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data as Profile | null;
});

export async function getReputationScore(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_reputation_scores")
    .select("reputation_score")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data ? Number(data.reputation_score) : 0;
}

export async function getMySkills(profileId: string): Promise<ProfileSkill[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_skills")
    .select("id, proficiency, is_verified, skills(name)")
    .eq("profile_id", profileId);
  return (data ?? []) as unknown as ProfileSkill[];
}

/** Just the skill ids a member has claimed — for matching against project_skills elsewhere (e.g. Discover). */
export async function getMySkillIds(profileId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profile_skills").select("skill_id").eq("profile_id", profileId);
  return (data ?? []).map((row) => row.skill_id as string);
}

export async function getAchievements(profileId: string): Promise<Achievement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("profile_id", profileId)
    .order("awarded_at", { ascending: false });
  return (data ?? []) as Achievement[];
}
