"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `project-${suffix}`;
}

export type CreateProjectFormState = { error?: string } | undefined;

export async function createProjectAction(
  _prevState: CreateProjectFormState,
  formData: FormData
): Promise<CreateProjectFormState> {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pillarCode = String(formData.get("pillarCode") ?? "").trim();
  const stage = String(formData.get("stage") ?? "IDEA").trim();
  const lookingFor = String(formData.get("lookingFor") ?? "").trim();

  if (name.length < 2) {
    return { error: "Enter a project name." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      name,
      slug: slugify(name),
      tagline: tagline || null,
      description: description || null,
      pillar_code: pillarCode || null,
      stage,
      looking_for: lookingFor || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create the project. Please try again." };
  }

  revalidatePath("/build");
  redirect(`/build/${data.id}`);
}

export async function joinProjectAction(projectId: string) {
  const userId = await requireUserId();

  const supabase = await createClient();
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    profile_id: userId,
    role: "MEMBER",
    status: "ACTIVE",
  });

  if (error) {
    throw new Error("Could not join this project.");
  }

  revalidatePath(`/build/${projectId}`);
  revalidatePath("/build");
}

export type CreateContributionFormState = { error?: string; success?: boolean } | undefined;

export async function createContributionAction(
  _prevState: CreateContributionFormState,
  formData: FormData
): Promise<CreateContributionFormState> {
  const userId = await requireUserId();

  const type = String(formData.get("type") ?? "OTHER");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!title) {
    return { error: "Describe what you're contributing." };
  }
  if (!projectId) {
    return { error: "Pick which project this contribution is for." };
  }

  const supabase = await createClient();

  // A contribution can only ever be reviewed by a project's team (see
  // contributions_update RLS), so it must genuinely belong to a project the
  // member is active on — not just any project id someone could pass in.
  const { data: membership } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("profile_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!membership) {
    return { error: "You're not an active member of that project." };
  }

  const { error } = await supabase.from("contributions").insert({
    profile_id: userId,
    project_id: projectId,
    type,
    title,
    description: description || null,
  });

  if (error) {
    return { error: "Could not log this contribution." };
  }

  revalidatePath("/build");
  revalidatePath(`/build/${projectId}`);
  return { success: true };
}

export async function respondToContributionAction(contributionId: string, accept: boolean) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: contribution } = await supabase
    .from("contributions")
    .select("project_id")
    .eq("id", contributionId)
    .maybeSingle();

  if (!contribution?.project_id) {
    throw new Error("This contribution isn't linked to a project.");
  }

  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", contribution.project_id)
    .eq("profile_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    throw new Error("Only the project's owner or admins can review contributions.");
  }

  const { error } = await supabase
    .from("contributions")
    .update({ status: accept ? "ACCEPTED" : "DECLINED", reviewed_by: userId })
    .eq("id", contributionId);

  if (error) {
    throw new Error("Could not update this contribution.");
  }

  revalidatePath(`/build/${contribution.project_id}`);
  revalidatePath("/build");
}
