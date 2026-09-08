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
    .select("role, status, joined_at, profiles(id, full_name, username, passport_id)")
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
