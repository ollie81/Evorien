"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The unread badge and the bell's dropdown are rendered by app/(app)/layout.tsx,
 * not by /notifications — so revalidating only the page left the dot lit and the
 * dropdown showing already-read items on every other route until a hard reload.
 * Revalidating the root layout is what actually refreshes them.
 */
function revalidateNotificationSurfaces() {
  revalidatePath("/", "layout");
}

export async function markNotificationReadAction(notificationId: string) {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("profile_id", userId);

  revalidateNotificationSurfaces();
}

export async function markAllNotificationsReadAction() {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("profile_id", userId)
    .eq("is_read", false);

  revalidateNotificationSurfaces();
}
