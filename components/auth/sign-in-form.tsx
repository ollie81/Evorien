"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  resendConfirmationAction,
  signInAction,
  type AuthFormState,
  type ResendConfirmationFormState,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: AuthFormState = undefined;
const initialResendState: ResendConfirmationFormState = undefined;

// Never surface Supabase/provider error text directly — the callback route
// and signInWithGoogleAction only ever forward one of these fixed codes.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: "Google sign-in was cancelled.",
  oauth_start_failed: "Could not start Google sign-in. Please try again.",
  confirmation_failed:
    "This link is invalid or has expired. Please sign in, or request a new confirmation email below.",
};

const EMAIL_NOT_CONFIRMED = "Please confirm your email first — check your inbox for the confirmation link.";

export function SignInForm({
  authError,
  passwordReset,
}: {
  authError?: string;
  passwordReset?: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [resendState, resendAction, resendPending] = useActionState(resendConfirmationAction, initialResendState);
  const [email, setEmail] = useState("");

  const topLevelError =
    state?.error ?? (authError ? (AUTH_ERROR_MESSAGES[authError] ?? "Something went wrong. Please try again.") : undefined);

  return (
    <div className="space-y-5">
      <GoogleSignInButton />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
      {passwordReset && (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          Password updated — sign in with your new password.
        </p>
      )}
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {topLevelError && (
          <p className="text-sm text-destructive" role="alert">
            {topLevelError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New to Ollieen?{" "}
          <Link href="/sign-up" className="font-medium text-foreground underline underline-offset-4">
            Create your Passport
          </Link>
        </p>
      </form>
      {state?.error === EMAIL_NOT_CONFIRMED && (
        <div className="text-center">
          {resendState?.success ? (
            <p className="text-sm text-muted-foreground">Confirmation email resent — check your inbox.</p>
          ) : (
            <form action={resendAction}>
              <input type="hidden" name="email" value={email} />
              {resendState?.error && (
                <p className="mb-2 text-sm text-destructive" role="alert">
                  {resendState.error}
                </p>
              )}
              <Button type="submit" variant="link" size="sm" disabled={resendPending || !email}>
                {resendPending ? "Resending…" : "Resend confirmation email"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
