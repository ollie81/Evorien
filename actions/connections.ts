"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ConnectionActionState = { error?: string } | undefined;

export async function sendConnectionRequestAction(
  targetProfileId: string,
  projectId?: string | null
): Promise<ConnectionActionState> {
  const userId = await requireUserId();
  if (userId === targetProfileId) {
    return { error: "You can't connect with yourself." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("connections").insert({
    requester_id: userId,
    addressee_id: targetProfileId,
    project_id: projectId ?? null,
  });

  if (error) {
    if (error.code !== "23505") {
      console.error("sendConnectionRequestAction: could not insert connection", error);
    }
    return {
      error:
        error.code === "23505"
          ? "A connection already exists with this member."
          : "Could not send request.",
    };
  }

  revalidatePath("/discover");
  return undefined;
}

/** Bare-form-action wrapper around sendConnectionRequestAction — form actions must return void, not a result object to display inline (there's no inline error UI at this call site; a failure just means the request silently doesn't go through, same as a duplicate-request race would). */
export async function expressProjectInterestAction(targetProfileId: string, projectId: string): Promise<void> {
  await sendConnectionRequestAction(targetProfileId, projectId);
}

export async function respondToConnectionAction(
  connectionId: string,
  accept: boolean
): Promise<ConnectionActionState> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("connections")
    .update({ status: accept ? "ACCEPTED" : "DECLINED" })
    .eq("id", connectionId)
    .eq("addressee_id", userId);

  if (error) {
    return { error: "Could not update this request." };
  }

  revalidatePath("/passport/connections");
  revalidatePath("/passport");
  revalidatePath("/notifications");
  return undefined;
}
