"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function castVoteAction(proposalId: string, optionId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("votes")
    .insert({ proposal_id: proposalId, option_id: optionId, profile_id: userId });

  if (error) {
    throw new Error(
      error.code === "23505" ? "You've already voted on this proposal." : "Could not cast your vote."
    );
  }

  revalidatePath("/city/governance");
}

export type ProposeCharterChangeFormState = { error?: string; success?: boolean } | undefined;

export async function proposeCharterChangeAction(
  _prevState: ProposeCharterChangeFormState,
  formData: FormData
): Promise<ProposeCharterChangeFormState> {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !description) {
    return { error: "Fill in both a title and a description." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("charter_proposals")
    .insert({ proposed_by: userId, title, description });

  if (error) {
    return { error: "Could not submit your proposal." };
  }

  revalidatePath("/city/charter");
  return { success: true };
}

export type ReviewCharterProposalFormState = { error?: string } | undefined;

export async function reviewCharterProposalAction(
  proposalId: string,
  status: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"
) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("charter_proposals")
    .update({ status })
    .eq("id", proposalId);
  if (error) throw new Error("Could not update this proposal.");
  revalidatePath("/city/charter");
  revalidatePath("/admin/charter");
}

export type PublishCharterVersionFormState = { error?: string } | undefined;

export async function publishCharterVersionAction(
  _prevState: PublishCharterVersionFormState,
  formData: FormData
): Promise<PublishCharterVersionFormState> {
  const userId = await requireUserId();
  await requireAdmin();

  const version = String(formData.get("version") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!version || !title || !content) {
    return { error: "Fill in the version, title, and full charter text." };
  }

  const supabase = await createClient();

  // Only one charter version may be "current" — clear the old one first.
  await supabase.from("charter_versions").update({ is_current: false }).eq("is_current", true);

  const { error } = await supabase.from("charter_versions").insert({
    version,
    title,
    content,
    is_current: true,
    published_at: new Date().toISOString(),
    created_by: userId,
  });

  if (error) {
    return { error: error.code === "23505" ? "That version number already exists." : "Could not publish the charter." };
  }

  revalidatePath("/city/charter");
  revalidatePath("/admin/charter");
  return undefined;
}

export type CreateCityFormState = { error?: string } | undefined;

export async function createCityAction(
  _prevState: CreateCityFormState,
  formData: FormData
): Promise<CreateCityFormState> {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const status = String(formData.get("status") ?? "RESEARCH");
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !country) {
    return { error: "Enter a name and country." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cities").insert({
    name,
    country,
    status,
    description: description || null,
  });

  if (error) {
    return { error: "Could not create this location." };
  }

  revalidatePath("/city/locations");
  revalidatePath("/admin/cities");
  return undefined;
}

export async function updateCityStatusAction(cityId: string, status: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("cities").update({ status }).eq("id", cityId);
  if (error) throw new Error("Could not update this location's status.");
  revalidatePath("/city/locations");
  revalidatePath("/admin/cities");
}

export type CreateProposalFormState = { error?: string } | undefined;

export async function createProposalAction(
  _prevState: CreateProposalFormState,
  formData: FormData
): Promise<CreateProposalFormState> {
  const userId = await requireUserId();
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const optionsRaw = String(formData.get("options") ?? "");
  const votingDays = Number(formData.get("votingDays") ?? 7);

  const options = optionsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title || !description) {
    return { error: "Fill in a title and description." };
  }
  if (options.length < 2) {
    return { error: "Enter at least two options, one per line." };
  }

  const supabase = await createClient();
  const votingStartsAt = new Date();
  const votingEndsAt = new Date(votingStartsAt.getTime() + votingDays * 24 * 60 * 60 * 1000);

  const { data: proposal, error } = await supabase
    .from("proposals")
    .insert({
      created_by: userId,
      title,
      description,
      status: "ACTIVE",
      voting_starts_at: votingStartsAt.toISOString(),
      voting_ends_at: votingEndsAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !proposal) {
    return { error: "Could not create this proposal." };
  }

  const { error: optionsError } = await supabase.from("proposal_options").insert(
    options.map((label, index) => ({
      proposal_id: proposal.id,
      label,
      sort_order: index,
    }))
  );

  if (optionsError) {
    return { error: "Proposal created, but the options failed to save." };
  }

  revalidatePath("/city/governance");
  redirect("/city/governance");
}
