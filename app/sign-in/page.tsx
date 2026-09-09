import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const authError = typeof params.authError === "string" ? params.authError : undefined;
  const passwordReset = params.passwordReset === "1";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <p className="font-heading text-2xl font-semibold tracking-tight">EVORIEN</p>
          <p className="text-sm text-muted-foreground">Build the future with us.</p>
        </div>
        <SignInForm authError={authError} passwordReset={passwordReset} />
      </div>
    </div>
  );
}
