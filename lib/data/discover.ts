import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Project } from "@/lib/types";

export interface DiscoverQuery {
  q?: string;
  pillar?: string;
}

export async function searchPeople({ q, pillar }: DiscoverQuery): Promise<Profile[]> {
  const supabase = await createClient();
  let query = supabase.from("profiles").select("*").eq("onboarding_completed", true);

  if (pillar) query = query.contains("pillars", [pillar]);
  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`full_name.ilike.%${term}%,username.ilike.%${term}%,country.ilike.%${term}%`);
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(30);
  return (data ?? []) as Profile[];
}

export async function searchProjects({ q, pillar }: DiscoverQuery): Promise<Project[]> {
  const supabase = await createClient();
  let query = supabase.from("projects").select("*").eq("status", "ACTIVE");

  if (pillar) query = query.eq("pillar_code", pillar);
  if (q?.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,tagline.ilike.%${term}%,looking_for.ilike.%${term}%`);
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(30);
  return (data ?? []) as Project[];
}
