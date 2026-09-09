"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";

export type AuthFormState = { error?: string } | undefined;

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: error.message.includes("Invalid login credentials")
        ? "Incorrect email or password."
        : error.message.includes("Email not confirmed")
          ? "Please confirm your email first — check your inbox for the confirmation link."
          : "Sign in failed. Please try again.",
    };
  }

  redirect("/");
}

export type SignUpFormState =
  | { error?: string; success?: boolean; email?: string }
  | undefined;

export async function signUpAction(
  _prevState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const origin = await getSiteOrigin();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return {
      error:
        error.message.includes("already registered") || error.message.includes("User already registered")
          ? "An account with this email already exists."
          : "Could not create your account. Please try again.",
    };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return { success: true, email };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

/**
 * Server-side signInWithOAuth returns a URL instead of auto-redirecting
 * (that only happens in a browser context) — Supabase's own documented
 * Next.js App Router pattern is to hand that URL to next/navigation's
 * redirect() from a Server Action, same shape as every other auth action
 * in this file.
 */
export async function signInWithGoogleAction() {
  const origin = await getSiteOrigin();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/sign-in?authError=oauth_start_failed");
  }

  redirect(data.url);
}

export type ForgotPasswordFormState = { error?: string; success?: boolean } | undefined;

export async function forgotPasswordAction(
  _prevState: ForgotPasswordFormState,
  formData: FormData
): Promise<ForgotPasswordFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const origin = await getSiteOrigin();

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  // Always the same response whether or not this email has an account —
  // revealing that would let someone enumerate registered addresses.
  return { success: true };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Could not update your password. Please request a new reset link." };
  }

  // The recovery link left the browser with a real (if short-lived in
  // practice) session — sign out so the member logs in fresh with their
  // new password, matching the flow they'd expect.
  await supabase.auth.signOut();
  redirect("/sign-in?passwordReset=1");
}

export type ResendConfirmationFormState = { error?: string; success?: boolean } | undefined;

export async function resendConfirmationAction(
  _prevState: ResendConfirmationFormState,
  formData: FormData
): Promise<ResendConfirmationFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Missing email address." };
  }

  const origin = await getSiteOrigin();

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { error: "Could not resend confirmation email. Please try again shortly." };
  }
  return { success: true };
}
