"use server";

import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getLiveActivity, type LiveActivity } from "@/lib/data/presence";

/**
 * Called on a timer from PresenceHeartbeat while a member has the app
 * open. Writing only their own row is enforced by RLS (presence_*_own),
 * not just by this action — this is the belt, RLS is the suspenders.
 */
export async function heartbeatAction() {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase
    .from("presence")
    .upsert({ profile_id: userId, last_seen_at: new Date().toISOString() });
}

/** Polled from the client to update the Live Now numbers without a reload. */
export async function getLiveActivityAction(): Promise<LiveActivity> {
  return getLiveActivity();
}
