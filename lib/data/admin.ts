import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminReport {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { full_name: string | null; username: string | null; passport_id: string } | null;
}

export async function getOpenReports(): Promise<AdminReport[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, created_at, profiles!reports_reporter_id_fkey(full_name, username, passport_id)"
    )
    .in("status", ["OPEN", "REVIEWING"])
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    reporter_id: row.reporter_id as string,
    target_type: row.target_type as string,
    target_id: row.target_id as string,
    reason: row.reason as string,
    details: row.details as string | null,
    status: row.status as string,
    created_at: row.created_at as string,
    reporter: row.profiles as unknown as AdminReport["reporter"],
  }));
}

export async function getOpenReportCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .in("status", ["OPEN", "REVIEWING"]);
  return count ?? 0;
}

export interface AdminVerificationRequest {
  id: string;
  profile_id: string;
  requested_level: string;
  status: string;
  notes: string | null;
  evidence_path: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile: { full_name: string | null; username: string | null; passport_id: string } | null;
}

const VERIFICATION_SELECT =
  "id, profile_id, requested_level, status, notes, evidence_path, rejection_reason, created_at, reviewed_at, profiles!verifications_profile_id_fkey(full_name, username, passport_id)";

function mapVerificationRow(row: Record<string, unknown>): AdminVerificationRequest {
  return {
    id: row.id as string,
    profile_id: row.profile_id as string,
    requested_level: row.requested_level as string,
    status: row.status as string,
    notes: row.notes as string | null,
    evidence_path: row.evidence_path as string | null,
    rejection_reason: row.rejection_reason as string | null,
    created_at: row.created_at as string,
    reviewed_at: row.reviewed_at as string | null,
    profile: row.profiles as unknown as AdminVerificationRequest["profile"],
  };
}

export async function getPendingVerifications(): Promise<AdminVerificationRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("verifications")
    .select(VERIFICATION_SELECT)
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  return (data ?? []).map(mapVerificationRow);
}

/** For admin context only — never shown to other members. Lets a reviewer see what was already decided before making another call. */
export async function getRecentlyReviewedVerifications(limit = 20): Promise<AdminVerificationRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("verifications")
    .select(VERIFICATION_SELECT)
    .neq("status", "PENDING")
    .order("reviewed_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapVerificationRow);
}

export async function getPendingVerificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("verifications")
    .select("*", { count: "exact", head: true })
    .eq("status", "PENDING");
  return count ?? 0;
}

export async function getEvidenceSignedUrl(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("verification-evidence")
    .createSignedUrl(path, 60 * 5);
  return data?.signedUrl ?? null;
}

export interface AdminProfileSkill {
  id: string;
  profile_id: string;
  is_verified: boolean;
  created_at: string;
  skill: { name: string } | null;
  profile: { full_name: string | null; username: string | null; passport_id: string } | null;
}

export async function getAllProfileSkills(): Promise<AdminProfileSkill[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profile_skills")
    .select(
      "id, profile_id, is_verified, created_at, skill:skills(name), profile:profiles!profile_skills_profile_id_fkey(full_name, username, passport_id)"
    )
    .order("is_verified", { ascending: true })
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as AdminProfileSkill[];
}

export async function getUnverifiedSkillCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profile_skills")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", false);
  return count ?? 0;
}

export interface AdminMemberPlan {
  id: string;
  full_name: string | null;
  username: string | null;
  passport_id: string;
  plan: string; // "FREE" when no active subscriptions row exists
}

export async function getMembersWithPlans(): Promise<AdminMemberPlan[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, username, passport_id, subscriptions(plan, status)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((row) => {
    const subscription = (row.subscriptions as unknown as { plan: string; status: string }[])[0];
    return {
      id: row.id as string,
      full_name: row.full_name as string | null,
      username: row.username as string | null,
      passport_id: row.passport_id as string,
      plan: subscription?.status === "ACTIVE" ? subscription.plan : "FREE",
    };
  });
}
