"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
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
