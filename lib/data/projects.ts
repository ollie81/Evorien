import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Contribution, Opportunity, Profile, Project, ProjectMember } from "@/lib/types";

export async function getMyProjects(userId: string): Promise<(Project & { my_role: string })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("role, status, projects(*)")
    .eq("profile_id", userId)
    .eq("status", "ACTIVE")
    .order("joined_at", { ascending: false });

  return (data ?? [])
    .filter((row) => row.projects)
    .map((row) => ({ ...(row.projects as unknown as Project), my_role: row.role }));
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  return data as Project | null;
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("role, status, joined_at, profiles(id, full_name, username, passport_id, avatar_url)")
    .eq("project_id", projectId)
    .eq("status", "ACTIVE")
    .order("joined_at");
  return (data ?? []) as unknown as ProjectMember[];
}

export async function getOpenOpportunities(): Promise<Opportunity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });
  return (data ?? []) as Opportunity[];
}

export async function getMyContributions(userId: string): Promise<Contribution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contributions")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Contribution[];
}

export interface ProjectContribution extends Contribution {
  contributor: Pick<Profile, "id" | "full_name" | "username" | "passport_id"> | null;
}

export async function getProjectContributions(projectId: string): Promise<ProjectContribution[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contributions")
    .select("*, contributor:profiles!contributions_profile_id_fkey(id, full_name, username, passport_id)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ProjectContribution[];
}

export interface ProjectSkillRow {
  id: string;
  is_filled: boolean;
  skill: { id: string; name: string } | null;
}

export async function getProjectSkills(projectId: string): Promise<ProjectSkillRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_skills")
    .select("id, is_filled, skill:skills(id, name)")
    .eq("project_id", projectId)
    .order("is_filled");
  return (data ?? []) as unknown as ProjectSkillRow[];
}

export async function getProjectOpportunities(projectId: string): Promise<Opportunity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("opportunities")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Opportunity[];
}

/** Maps opportunity id -> the viewer's own application, so Apply buttons can show status without an N+1 query. */
export async function getMyApplicationsMap(userId: string): Promise<Map<string, { id: string; status: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id, opportunity_id, status")
    .eq("applicant_id", userId);

  const map = new Map<string, { id: string; status: string }>();
  for (const row of data ?? []) {
    map.set(row.opportunity_id as string, { id: row.id as string, status: row.status as string });
  }
  return map;
}

export interface OpportunityApplication {
  id: string;
  opportunity_id: string;
  message: string | null;
  status: string;
  created_at: string;
  applicant: Pick<Profile, "id" | "full_name" | "username" | "passport_id"> | null;
}

/** Every application against opportunities the viewer posted, for inline review — not scoped to one project or one opportunity. */
export async function getApplicationsForPostedOpportunities(userId: string): Promise<OpportunityApplication[]> {
  const supabase = await createClient();
  const { data: myOpportunities } = await supabase.from("opportunities").select("id").eq("posted_by", userId);
  const opportunityIds = (myOpportunities ?? []).map((o) => o.id as string);
  if (opportunityIds.length === 0) return [];

  const { data } = await supabase
    .from("applications")
    .select(
      "id, opportunity_id, message, status, created_at, applicant:profiles!applications_applicant_id_fkey(id, full_name, username, passport_id)"
    )
    .in("opportunity_id", opportunityIds)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as OpportunityApplication[];
}

export function groupApplicationsByOpportunity(
  applications: OpportunityApplication[]
): Map<string, OpportunityApplication[]> {
  const map = new Map<string, OpportunityApplication[]>();
  for (const application of applications) {
    const list = map.get(application.opportunity_id) ?? [];
    list.push(application);
    map.set(application.opportunity_id, list);
  }
  return map;
}
