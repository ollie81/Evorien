"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock, FolderKanban, MessageCircle, UserPlus } from "lucide-react";
import { sendConnectionRequestAction } from "@/actions/connections";
import { startConversationAction } from "@/actions/messages";
import type { ConnectionState } from "@/lib/data/connections";
import { Button } from "@/components/ui/button";

export function ConnectButton({
  profileId,
  initialState,
  projectId,
}: {
  profileId: string;
  initialState: ConnectionState;
  /** Set when this Connect was suggested because the target fills a need on one of the viewer's own projects — carried onto the request, then surfaced as a "View Project" next step once accepted. */
  projectId?: string | null;
}) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (state === "ACCEPTED") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="size-3.5" />
          Connected
        </span>
        <div className="flex gap-1.5">
          <Button
            variant="outline"
            size="sm"
            render={
              projectId ? (
                <Link href={`/build/${projectId}`}>
                  <FolderKanban className="size-4" />
                  View Project
                </Link>
              ) : (
                <Link href={`/passport/${profileId}`}>View Passport</Link>
              )
            }
          />
          <form action={startConversationAction.bind(null, profileId)}>
            <Button type="submit" size="sm" aria-label="Message">
              <MessageCircle className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (state === "PENDING_SENT") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Clock className="size-4" />
        Requested
      </Button>
    );
  }

  if (state === "PENDING_RECEIVED") {
    return <Button variant="outline" size="sm" render={<Link href="/passport/connections">Respond</Link>} />;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await sendConnectionRequestAction(profileId, projectId);
            if (result?.error) {
              setError(result.error);
            } else {
              setState("PENDING_SENT");
            }
          });
        }}
      >
        <UserPlus className="size-4" />
        {pending ? "Sending…" : "Connect"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
