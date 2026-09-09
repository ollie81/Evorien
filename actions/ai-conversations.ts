"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function deleteConversationAction(conversationId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("profile_id", userId);

  if (error) throw new Error("Could not delete this conversation.");
  revalidatePath("/ai/history");
}

export async function deleteAllConversationsAction() {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("ai_conversations").delete().eq("profile_id", userId);

  if (error) throw new Error("Could not delete your conversations.");
  revalidatePath("/ai/history");
}
