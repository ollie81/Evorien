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
  created_at: string;
  profile: { full_name: string | null; username: string | null; passport_id: string } | null;
}

export async function getPendingVerifications(): Promise<AdminVerificationRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("verifications")
    .select(
      "id, profile_id, requested_level, status, notes, evidence_path, created_at, profiles!verifications_profile_id_fkey(full_name, username, passport_id)"
    )
    .eq("status", "PENDING")
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id as string,
    profile_id: row.profile_id as string,
    requested_level: row.requested_level as string,
    status: row.status as string,
    notes: row.notes as string | null,
    evidence_path: row.evidence_path as string | null,
    created_at: row.created_at as string,
    profile: row.profiles as unknown as AdminVerificationRequest["profile"],
  }));
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
