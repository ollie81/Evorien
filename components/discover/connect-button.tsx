"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Clock, UserPlus } from "lucide-react";
import { sendConnectionRequestAction } from "@/actions/connections";
import type { ConnectionState } from "@/lib/data/connections";
import { Button } from "@/components/ui/button";

export function ConnectButton({
  profileId,
  initialState,
}: {
  profileId: string;
  initialState: ConnectionState;
}) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (state === "ACCEPTED") {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Check className="size-4" />
        Connected
      </Button>
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
            const result = await sendConnectionRequestAction(profileId);
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
