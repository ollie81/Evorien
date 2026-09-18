"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Where an in-flight invite is parked between "someone clicked a link" and
 * "that person finished onboarding".
 *
 * A cookie rather than a query parameter because the journey in between is not
 * a single hop: sign-up, a confirmation email opened in whatever browser the
 * mail app chooses, /auth/callback, then onboarding. A parameter would be lost
 * at the first of those; the cookie survives all of them. httpOnly since only
 * Server Actions ever read it, and 30 days because confirmation emails are
 * routinely opened a day or two late.
 */
const INVITE_COOKIE = "ollieen_invite";
const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Remember the invite, then send the visitor into the normal sign-up flow.
 *
 * Nothing is written to the database here — the code is only claimed once
 * there is a real member to connect, in redeemPendingInvite below. A visitor
 * who never finishes signing up leaves no trace.
 */
export async function acceptInviteAction(code: string): Promise<void> {
  const jar = await cookies();
  jar.set(INVITE_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: INVITE_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/sign-up");
}

/**
 * Claim a parked invite for the member who just finished onboarding.
 *
 * Called at the end of completeOnboardingAction, deliberately after the
 * profile has been written: the notification the inviter receives names the
 * new member, so it has to run once there is a name to use.
 *
 * Never throws and never blocks. redeem_invite returns false for an unknown,
 * self-issued, or already-redeemed code, and any unexpected failure is
 * swallowed here — a bad invite must not be able to strand someone on the
 * last step of creating their Passport. The cookie is cleared either way so a
 * stale code isn't retried forever.
 */
export async function redeemPendingInvite(): Promise<void> {
  const jar = await cookies();
  const code = jar.get(INVITE_COOKIE)?.value;
  if (!code) return;

  try {
    const supabase = await createClient();
    await supabase.rpc("redeem_invite", { p_code: code });
  } catch {
    // Intentionally ignored — see the note above.
  } finally {
    jar.delete(INVITE_COOKIE);
  }
}
