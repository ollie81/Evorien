import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const expiredLink = params.authError === "expired_link";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="font-heading text-2xl font-semibold tracking-tight">Forgot password</p>
          <p className="text-sm text-muted-foreground">We&apos;ll email you a link to reset it.</p>
        </div>
        <ForgotPasswordForm expiredLink={expiredLink} />
      </div>
    </div>
  );
}
