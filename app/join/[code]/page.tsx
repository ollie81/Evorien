import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getInvitePreview } from "@/lib/data/invites";
import { acceptInviteAction } from "@/actions/invites";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "You've been invited",
  // An invite link is meant for one person, not for search results. It carries
  // a member's name, and indexing it would also put a working code in a public
  // index — so this is the one page that opts out explicitly.
  robots: { index: false, follow: false },
};

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  // Already a member — most often someone who clicked a link shared into a
  // group chat they're already in. Nothing to redeem, so just let them in.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims) redirect("/");

  const preview = await getInvitePreview(code);

  // An unknown or revoked code still has a person on the other end of it, so
  // this stays a way in rather than an error page.
  if (!preview) {
    return (
      <div className="mx-auto flex min-h-full max-w-lg flex-1 items-center px-4 py-12">
        <Card className="w-full">
          <CardContent className="space-y-5 text-center">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              This invite link isn&apos;t valid
            </h1>
            <p className="text-sm text-muted-foreground">
              It may have been mistyped or since removed. You can still join Ollieen directly.
            </p>
            <Button render={<Link href="/welcome">See what Ollieen is</Link>} className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const initial = preview.inviterName.trim().charAt(0).toUpperCase() || "O";

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-1 items-center px-4 py-12">
      <Card className="w-full">
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar className="size-16">
              {preview.inviterAvatar && (
                <AvatarImage src={preview.inviterAvatar} alt="" />
              )}
              <AvatarFallback className="text-lg">{initial}</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <h1 className="font-heading text-xl font-semibold tracking-tight">
                {preview.inviterName} invited you to Ollieen
              </h1>
              <p className="text-sm text-muted-foreground">
                Create your Passport and you&apos;ll be connected to {preview.inviterName} straight
                away.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
            <p className="font-medium">What Ollieen is</p>
            <p className="text-muted-foreground">
              A network for finding collaborators and building real projects together — your
              skills, what you&apos;re looking for, and the people who match it.
            </p>
          </div>

          {/* Bare form action: the code is fixed by the URL, so there is nothing
              for the visitor to fill in and no state to thread back. */}
          <form action={acceptInviteAction.bind(null, code)}>
            <Button type="submit" className="w-full">
              Create your Passport
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Already a member?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
