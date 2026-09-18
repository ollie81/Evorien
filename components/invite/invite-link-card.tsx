"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function InviteLinkCard({ url, acceptedCount }: { url: string; acceptedCount: number }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused outright (an insecure origin, a
      // locked-down browser, a denied permission). Say so rather than
      // showing a success state for something that didn't happen — the
      // link is on screen and can still be copied by hand.
      toast.error("Couldn't copy — select the link and copy it manually");
    }
  }

  async function share() {
    // navigator.share only exists on mobile and some desktop browsers, and
    // rejects if the person dismisses the sheet — neither is an error worth
    // reporting, so a failure quietly falls back to copying.
    if (typeof navigator.share !== "function") {
      await copy();
      return;
    }
    try {
      await navigator.share({
        title: "Join me on Ollieen",
        text: "I'm building on Ollieen — create your Passport and we'll be connected.",
        url,
      });
    } catch {
      /* dismissed or unsupported — nothing to report */
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserPlus className="size-4.5" strokeWidth={1.75} />
          </span>
          <div className="space-y-1">
            <p className="font-medium">Invite someone</p>
            <p className="text-sm text-muted-foreground">
              Anyone who joins through your link is connected to you automatically.
            </p>
          </div>
        </div>

        <p className="overflow-x-auto rounded-lg bg-muted/50 px-3 py-2.5 font-mono text-xs whitespace-nowrap">
          {url}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copy} className="flex-1">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button size="sm" onClick={share} className="flex-1">
            <Share2 className="size-4" />
            Share
          </Button>
        </div>

        {acceptedCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {acceptedCount} {acceptedCount === 1 ? "person has" : "people have"} joined through your
            link.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
