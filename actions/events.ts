"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CreateEventFormState = { error?: string } | undefined;

export async function createEventAction(
  _prevState: CreateEventFormState,
  formData: FormData
): Promise<CreateEventFormState> {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const pillarCode = String(formData.get("pillarCode") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const isOnline = formData.get("isOnline") === "on";
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const endsAtRaw = String(formData.get("endsAt") ?? "").trim();

  if (title.length < 2) {
    return { error: "Enter a title for the event." };
  }

  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return { error: "Choose when the event starts." };
  }

  let endsAt: Date | null = null;
  if (endsAtRaw) {
    endsAt = new Date(endsAtRaw);
    if (Number.isNaN(endsAt.getTime())) {
      return { error: "That end time isn't valid." };
    }
    if (endsAt < startsAt) {
      return { error: "The event can't end before it starts." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    organizer_id: userId,
    title,
    description: description || null,
    pillar_code: pillarCode || null,
    location: location || null,
    is_online: isOnline,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt ? endsAt.toISOString() : null,
  });

  if (error) return { error: "Could not create this event." };

  revalidatePath("/community");
  return undefined;
}

export async function updateEventStatusAction(eventId: string, status: "COMPLETED" | "CANCELLED") {
  const userId = await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .eq("organizer_id", userId);

  if (error) throw new Error("Could not update this event.");

  revalidatePath("/community");
}
