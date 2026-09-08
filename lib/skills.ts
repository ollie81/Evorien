import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Get-or-create a skill by name (case-insensitive). Shared by profile skills, project skills, and Evorien AI's project builder. */
export async function getOrCreateSkillId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase.from("skills").select("id").ilike("name", trimmed).maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase.from("skills").insert({ name: trimmed }).select("id").single();
  if (error) return null;
  return created.id as string;
}
