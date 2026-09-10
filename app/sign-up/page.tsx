import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create your Passport",
  alternates: { canonical: "https://ollieen.com/sign-up" },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Build the future with us.
          </h1>
          <p className="text-sm text-muted-foreground">
            Create your Ollieen Passport — a digital membership identity for the network. It is
            not a government ID or citizenship.
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
