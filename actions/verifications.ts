"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type RequestVerificationFormState = { error?: string; success?: boolean } | undefined;

const VALID_LEVELS = new Set(["IDENTITY_VERIFIED", "SKILL_VERIFIED", "FOUNDER_VERIFIED"]);

export async function requestVerificationAction(
  _prevState: RequestVerificationFormState,
  formData: FormData
): Promise<RequestVerificationFormState> {
  const userId = await requireUserId();

  const requestedLevel = String(formData.get("requestedLevel") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  const evidencePath = String(formData.get("evidencePath") ?? "").trim();

  if (!VALID_LEVELS.has(requestedLevel)) {
    return { error: "Choose a verification level." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("verifications").insert({
    profile_id: userId,
    requested_level: requestedLevel,
    notes: notes || null,
    evidence_path: evidencePath || null,
  });

  if (error) {
    return { error: "Could not submit your request." };
  }

  revalidatePath("/passport");
  return { success: true };
}

export async function approveVerificationAction(verificationId: string, profileId: string, level: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("verifications")
    .update({ status: "APPROVED", reviewed_at: new Date().toISOString() })
    .eq("id", verificationId);
  if (updateError) throw new Error("Could not approve this request.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ verification_level: level })
    .eq("id", profileId);
  if (profileError) throw new Error("Could not update the member's verification level.");

  revalidatePath("/admin/verifications");
}

export async function rejectVerificationAction(verificationId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("verifications")
    .update({ status: "REJECTED", reviewed_at: new Date().toISOString() })
    .eq("id", verificationId);
  if (error) throw new Error("Could not reject this request.");

  revalidatePath("/admin/verifications");
}
