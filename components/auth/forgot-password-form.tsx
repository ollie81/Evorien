"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { forgotPasswordAction, type ForgotPasswordFormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ForgotPasswordFormState = undefined;

export function ForgotPasswordForm({ expiredLink }: { expiredLink?: boolean }) {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state?.success) {
    return (
      <div className="space-y-4">
        <MailCheck className="size-9 text-primary" strokeWidth={1.5} />
        <div>
          <h1 className="font-heading text-xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an Evorien account exists for that address, we&apos;ve sent a link to reset your
            password.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/sign-in">Back to sign in</Link>} />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {expiredLink && (
        <p className="text-sm text-destructive" role="alert">
          That reset link is invalid or has expired. Request a new one below.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
