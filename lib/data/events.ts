import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export interface EvorienEvent {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  pillar_code: string | null;
  location: string | null;
  is_online: boolean;
  starts_at: string;
  ends_at: string | null;
  status: string;
  organizer: Pick<Profile, "id" | "full_name" | "username" | "passport_id"> | null;
}

const EVENT_SELECT =
  "id, organizer_id, title, description, pillar_code, location, is_online, starts_at, ends_at, status, organizer:profiles!events_organizer_id_fkey(id, full_name, username, passport_id)";

export async function getUpcomingEvents(): Promise<EvorienEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "SCHEDULED")
    .order("starts_at", { ascending: true });
  return (data ?? []) as unknown as EvorienEvent[];
}

export async function getPastEvents(limit = 10): Promise<EvorienEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .in("status", ["COMPLETED", "CANCELLED"])
    .order("starts_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as EvorienEvent[];
}
