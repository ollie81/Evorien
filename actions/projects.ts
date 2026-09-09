"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import { getOrCreateSkillId } from "@/lib/skills";

/** Mirrors is_project_team() from the schema — an OWNER/ADMIN can manage the project's skills, opportunities and details. */
async function isProjectManager(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("profile_id", userId)
    .eq("status", "ACTIVE")
    .maybeSingle();
  return Boolean(data && (data.role === "OWNER" || data.role === "ADMIN"));
}

export interface NewProjectInput {
  name: string;
  tagline?: string;
  description?: string;
  pillarCode?: string;
  stage?: string;
  lookingFor?: string;
  /** Skill names (not ids) — resolved via get-or-create so the caller never needs to know skill ids. */
  skills?: string[];
}

/**
 * Shared by createProjectAction (the manual "New project" form) and
 * createProjectFromAiDraftAction (Ollieen AI's project builder, after the
 * member explicitly confirms) — one insert path, not two, so a change to
 * project-creation logic never has to be made twice.
 */
async function insertProject(userId: string, input: NewProjectInput): Promise<{ id: string } | { error: string }> {
  const name = input.name.trim();
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
      tagline: input.tagline?.trim() || null,
      description: input.description?.trim() || null,
      pillar_code: input.pillarCode?.trim() || null,
      stage: input.stage?.trim() || "IDEA",
      looking_for: input.lookingFor?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Could not create the project. Please try again." };
  }

  const projectId = data.id as string;

  for (const skillName of input.skills ?? []) {
    const skillId = await getOrCreateSkillId(supabase, skillName);
    if (skillId) {
      await supabase.from("project_skills").upsert(
        { project_id: projectId, skill_id: skillId },
        { onConflict: "project_id,skill_id" }
      );
    }
  }

  revalidatePath("/build");
  return { id: projectId };
}

export type CreateProjectFormState = { error?: string } | undefined;

export async function createProjectAction(
  _prevState: CreateProjectFormState,
  formData: FormData
): Promise<CreateProjectFormState> {
  const userId = await requireUserId();

  const result = await insertProject(userId, {
    name: String(formData.get("name") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    description: String(formData.get("description") ?? ""),
    pillarCode: String(formData.get("pillarCode") ?? ""),
    stage: String(formData.get("stage") ?? "IDEA"),
    lookingFor: String(formData.get("lookingFor") ?? ""),
  });

  if ("error" in result) {
    return { error: result.error };
  }

  redirect(`/build/${result.id}`);
}

export type CreateProjectFromDraftState = { error?: string; id?: string } | undefined;

/** Called only from the confirm button on Ollieen AI's project-draft card — never by the AI itself. */
export async function createProjectFromAiDraftAction(input: NewProjectInput): Promise<CreateProjectFromDraftState> {
  const userId = await requireUserId();
  const result = await insertProject(userId, input);
  if ("error" in result) {
    return { error: result.error };
  }
  return { id: result.id };
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

// ---------------------------------------------------------------------------
// SKILLS NEEDED
// ---------------------------------------------------------------------------

export type ProjectSkillFormState = { error?: string } | undefined;

export async function addProjectSkillAction(
  _prevState: ProjectSkillFormState,
  formData: FormData
): Promise<ProjectSkillFormState> {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const name = String(formData.get("skillName") ?? "").trim();
  if (!projectId || !name) return { error: "Enter a skill." };

  const supabase = await createClient();
  if (!(await isProjectManager(supabase, projectId, userId))) {
    return { error: "Only the project's owner or admins can manage skills needed." };
  }

  const skillId = await getOrCreateSkillId(supabase, name);
  if (!skillId) return { error: "Could not add that skill." };

  const { error } = await supabase
    .from("project_skills")
    .upsert({ project_id: projectId, skill_id: skillId }, { onConflict: "project_id,skill_id" });

  if (error) return { error: "Could not add that skill." };

  revalidatePath(`/build/${projectId}`);
  return undefined;
}

export async function toggleProjectSkillFilledAction(projectSkillId: string, projectId: string, filled: boolean) {
  const userId = await requireUserId();
  const supabase = await createClient();
  if (!(await isProjectManager(supabase, projectId, userId))) {
    throw new Error("Only the project's owner or admins can manage skills needed.");
  }

  const { error } = await supabase
    .from("project_skills")
    .update({ is_filled: filled })
    .eq("id", projectSkillId)
    .eq("project_id", projectId);

  if (error) throw new Error("Could not update this skill.");
  revalidatePath(`/build/${projectId}`);
}

export async function removeProjectSkillAction(projectSkillId: string, projectId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  if (!(await isProjectManager(supabase, projectId, userId))) {
    throw new Error("Only the project's owner or admins can manage skills needed.");
  }

  const { error } = await supabase
    .from("project_skills")
    .delete()
    .eq("id", projectSkillId)
    .eq("project_id", projectId);

  if (error) throw new Error("Could not remove this skill.");
  revalidatePath(`/build/${projectId}`);
}

// ---------------------------------------------------------------------------
// OPPORTUNITIES + APPLICATIONS ("collaboration applications")
// ---------------------------------------------------------------------------

export type CreateOpportunityFormState = { error?: string; success?: boolean } | undefined;

export async function createOpportunityAction(
  _prevState: CreateOpportunityFormState,
  formData: FormData
): Promise<CreateOpportunityFormState> {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "COLLABORATION").trim();
  const location = String(formData.get("location") ?? "").trim();
  const isRemote = formData.get("isRemote") === "on";
  const rawProjectId = String(formData.get("projectId") ?? "").trim();
  const projectId = rawProjectId === "none" ? "" : rawProjectId;

  if (!title || !description) {
    return { error: "Add a title and description." };
  }

  const supabase = await createClient();

  if (projectId && !(await isProjectManager(supabase, projectId, userId))) {
    return { error: "You can only post opportunities for projects you own or manage." };
  }

  const { error } = await supabase.from("opportunities").insert({
    posted_by: userId,
    project_id: projectId || null,
    title,
    description,
    type,
    location: location || null,
    is_remote: isRemote,
  });

  if (error) return { error: "Could not post this opportunity." };

  revalidatePath("/build");
  if (projectId) revalidatePath(`/build/${projectId}`);
  return { success: true };
}

export type ApplyActionState = { error?: string; id?: string } | undefined;

export async function applyToOpportunityAction(opportunityId: string, message: string): Promise<ApplyActionState> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("posted_by")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunity?.posted_by === userId) {
    return { error: "You can't apply to your own opportunity." };
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({ opportunity_id: opportunityId, applicant_id: userId, message: message || null })
    .select("id")
    .single();

  if (error) {
    return {
      error:
        error.code === "23505" ? "You've already applied to this opportunity." : "Could not submit your application.",
    };
  }

  revalidatePath("/build");
  return { id: data.id as string };
}

export async function withdrawApplicationAction(applicationId: string): Promise<ApplyActionState> {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("applications")
    .update({ status: "WITHDRAWN" })
    .eq("id", applicationId)
    .eq("applicant_id", userId);

  if (error) return { error: "Could not withdraw this application." };

  revalidatePath("/build");
  return undefined;
}

export async function respondToApplicationAction(applicationId: string, accept: boolean) {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("opportunity_id, opportunities(posted_by, project_id)")
    .eq("id", applicationId)
    .maybeSingle();

  const opportunity = application?.opportunities as unknown as
    | { posted_by: string; project_id: string | null }
    | null;

  if (!opportunity || opportunity.posted_by !== userId) {
    throw new Error("Only the person who posted this opportunity can review applications.");
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: accept ? "ACCEPTED" : "REJECTED" })
    .eq("id", applicationId);

  if (error) throw new Error("Could not update this application.");

  revalidatePath("/build");
  if (opportunity.project_id) revalidatePath(`/build/${opportunity.project_id}`);
}

export async function updateOpportunityStatusAction(opportunityId: string, status: "OPEN" | "FILLED" | "CLOSED") {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("posted_by, project_id")
    .eq("id", opportunityId)
    .maybeSingle();

  if (!opportunity || opportunity.posted_by !== userId) {
    throw new Error("Only the person who posted this opportunity can change its status.");
  }

  const { error } = await supabase.from("opportunities").update({ status }).eq("id", opportunityId);

  if (error) throw new Error("Could not update this opportunity.");

  revalidatePath("/build");
  if (opportunity.project_id) revalidatePath(`/build/${opportunity.project_id}`);
}

// ---------------------------------------------------------------------------
// PROJECT PROGRESS (editing)
// ---------------------------------------------------------------------------

export type UpdateProjectFormState = { error?: string } | undefined;

export async function updateProjectAction(
  _prevState: UpdateProjectFormState,
  formData: FormData
): Promise<UpdateProjectFormState> {
  const userId = await requireUserId();
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { error: "Missing project." };

  const supabase = await createClient();
  if (!(await isProjectManager(supabase, projectId, userId))) {
    return { error: "Only the project's owner or admins can edit it." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pillarCode = String(formData.get("pillarCode") ?? "").trim();
  const stage = String(formData.get("stage") ?? "IDEA").trim();
  const status = String(formData.get("status") ?? "ACTIVE").trim();
  const lookingFor = String(formData.get("lookingFor") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (name.length < 2) {
    return { error: "Enter a project name." };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      tagline: tagline || null,
      description: description || null,
      pillar_code: pillarCode || null,
      stage,
      status,
      looking_for: lookingFor || null,
      website: website || null,
      country: country || null,
      city: city || null,
    })
    .eq("id", projectId);

  if (error) return { error: "Could not save changes." };

  revalidatePath(`/build/${projectId}`);
  revalidatePath("/build");
  redirect(`/build/${projectId}`);
}
