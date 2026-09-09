"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import {
  resendConfirmationAction,
  signUpAction,
  type ResendConfirmationFormState,
  type SignUpFormState,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

const initialState: SignUpFormState = undefined;
const initialResendState: ResendConfirmationFormState = undefined;

function CheckEmailScreen({ email }: { email: string }) {
  const [resendState, resendAction, resendPending] = useActionState(resendConfirmationAction, initialResendState);

  return (
    <div className="space-y-4">
      <MailCheck className="size-9 text-primary" strokeWidth={1.5} />
      <div>
        <h1 className="font-heading text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
          Open it to activate your account, then come back and sign in.
        </p>
      </div>
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
          <Button type="submit" variant="link" size="sm" className="h-auto p-0" disabled={resendPending}>
            {resendPending ? "Resending…" : "Didn't get an email? Resend"}
          </Button>
        </form>
      )}
      <Button variant="outline" render={<Link href="/sign-in">Back to sign in</Link>} />
    </div>
  );
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  if (state?.success && state.email) {
    return <CheckEmailScreen email={state.email} />;
  }

  return (
    <div className="space-y-5">
      <GoogleSignInButton />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs text-muted-foreground">At least 8 characters</p>
        </div>
        {state?.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating your Passport…" : "Create my Passport"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
