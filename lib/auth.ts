import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer entry point. Verifies the caller's JWT (locally via
 * cached JWKS when the project uses asymmetric signing keys, otherwise a
 * single fast round trip) and returns its claims — `sub` is the profile id
 * everywhere else in the app.
 *
 * Wrapped in React's cache() so every Server Component / Server Action in
 * a single request shares one verification instead of repeating it. Never
 * trust a user id passed in from the client — always read it from here.
 */
export const getAuthClaims = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return data.claims;
});

/** Returns the current user's id, or null if signed out. */
export async function getUserId() {
  const claims = await getAuthClaims();
  return claims?.sub ?? null;
}

/** Use in Server Components / layouts that require a signed-in user. */
export async function requireUserId() {
  const userId = await getUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}

/**
 * Row Level Security already blocks a non-admin's writes at the database
 * level — this is the belt-and-suspenders check inside the Server Action
 * itself, per the rule that every action must independently re-verify the
 * caller rather than trusting that only admin UI links to it.
 */
export const isCurrentUserAdmin = cache(async () => {
  const userId = await getUserId();
  if (!userId) return false;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  return data?.is_admin ?? false;
});

/** Use at the top of every admin-only Server Action. Throws for non-admins. */
export async function requireAdmin() {
  const admin = await isCurrentUserAdmin();
  if (!admin) {
    throw new Error("Unauthorized: admin access required.");
  }
}
