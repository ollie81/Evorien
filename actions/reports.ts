"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CreateReportFormState = { error?: string; success?: boolean } | undefined;

const VALID_TARGET_TYPES = new Set(["POST", "COMMENT", "PROFILE", "PROJECT", "OPPORTUNITY"]);

export async function createReportAction(
  targetType: string,
  targetId: string,
  _prevState: CreateReportFormState,
  formData: FormData
): Promise<CreateReportFormState> {
  const userId = await requireUserId();

  if (!VALID_TARGET_TYPES.has(targetType)) {
    return { error: "Invalid report target." };
  }

  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!reason) {
    return { error: "Choose a reason." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: userId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details || null,
  });

  if (error) {
    return { error: "Could not submit your report." };
  }

  return { success: true };
}

export async function resolveReportAction(reportId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status: "RESOLVED" }).eq("id", reportId);
  if (error) throw new Error("Could not resolve this report.");
  revalidatePath("/admin/reports");
}

export async function dismissReportAction(reportId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("reports").update({ status: "DISMISSED" }).eq("id", reportId);
  if (error) throw new Error("Could not dismiss this report.");
  revalidatePath("/admin/reports");
}
