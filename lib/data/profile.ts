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

/**
 * Any member's Passport by id — for viewing someone else's (e.g. from
 * Discover or a match). RLS already allows any authenticated member to
 * read any onboarded profile's public fields; this just adds the
 * onboarding-completed gate a lookup-by-id needs that getMyProfile
 * doesn't (self always has an in-progress row to show, others don't).
 */
export async function getProfileById(profileId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("onboarding_completed", true)
    .maybeSingle();
  return data as Profile | null;
}

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
