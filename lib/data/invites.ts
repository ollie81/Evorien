import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface InvitePreview {
  inviterName: string;
  inviterAvatar: string | null;
}

export interface MyInvite {
  code: string;
  acceptedCount: number;
}

/**
 * The caller's own reusable invite link, created on first request.
 *
 * One stable link per member rather than a batch of single-use codes — see the
 * migration's header for why. Returns null rather than throwing if the RPC
 * fails, so a transient database problem degrades to "the invite card doesn't
 * render" instead of taking down the whole Passport page.
 */
export async function getMyInvite(): Promise<MyInvite | null> {
  const supabase = await createClient();

  const { data: code, error } = await supabase.rpc("get_or_create_my_invite");
  if (error || typeof code !== "string") return null;

  // Read back the count separately: get_or_create_my_invite returns just the
  // code, and RLS already limits this select to the caller's own row.
  const { data: row } = await supabase
    .from("invites")
    .select("accepted_count")
    .eq("code", code)
    .maybeSingle();

  return { code, acceptedCount: row?.accepted_count ?? 0 };
}

/**
 * Who issued this invite, for the signed-out landing page.
 *
 * Deliberately goes through the get_invite_preview SECURITY DEFINER function
 * rather than reading public.invites: that function returns a display name and
 * an avatar and nothing else, and the table itself has no anon policy at all,
 * so an unknown visitor holding a code can never read anything more about the
 * member who sent it.
 */
export async function getInvitePreview(code: string): Promise<InvitePreview | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_invite_preview", { p_code: code });
  if (error || !Array.isArray(data) || data.length === 0) return null;

  const row = data[0] as { inviter_name: string | null; inviter_avatar: string | null };
  if (!row?.inviter_name) return null;

  return { inviterName: row.inviter_name, inviterAvatar: row.inviter_avatar };
}
