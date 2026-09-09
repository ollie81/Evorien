import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

/**
 * Only reachable with a real session established by /auth/callback's code
 * exchange on a password-recovery link — not in PUBLIC_PAGES (see
 * lib/supabase/middleware.ts), so a signed-in visitor here is never
 * bounced away. A visitor with no session at all (direct link, already
 * used, expired) is sent to request a fresh one instead of hitting the
 * middleware's generic /welcome bounce.
 */
export default async function ResetPasswordPage() {
  const userId = await getUserId();
  if (!userId) {
    redirect("/forgot-password?authError=expired_link");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="font-heading text-2xl font-semibold tracking-tight">Choose a new password</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
