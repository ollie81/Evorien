"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordFormState = { error?: string; success?: boolean } | undefined;

/**
 * Re-authenticates with the current password before applying the change —
 * a merely-unlocked, still-signed-in browser session shouldn't be enough
 * on its own to take over the account.
 */
export async function changePasswordAction(
  _prevState: ChangePasswordFormState,
  formData: FormData
): Promise<ChangePasswordFormState> {
  await requireUserId();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Enter your current password and a new password." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Could not verify your account." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: "Could not update your password. Please try again." };
  }

  return { success: true };
}

export type DeleteAccountState = { error?: string } | undefined;

/**
 * Calls the delete_own_account() Postgres function (security definer,
 * hardcoded to auth.uid() — see supabase/migrations/20260909120003_
 * account_lifecycle.sql) so this never needs a service-role key. Signs
 * out with scope "local" rather than the default global sign-out: by the
 * time this runs, the underlying auth.users row is already gone, and a
 * normal signOut()'s server round-trip can fail against a user that no
 * longer exists — a local-only sign-out just clears the browser's cookies.
 */
export async function deleteAccountAction(): Promise<DeleteAccountState> {
  await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    return { error: "Could not delete your account. Please try again or contact support." };
  }

  await supabase.auth.signOut({ scope: "local" });
  redirect("/welcome?accountDeleted=1");
}
