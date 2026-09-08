"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { respondToConnectionAction } from "@/actions/connections";
import { Button } from "@/components/ui/button";

export function ConnectionRequestActions({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(async () => { await respondToConnectionAction(connectionId, true); })}
      >
        <Check className="size-4" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(async () => { await respondToConnectionAction(connectionId, false); })}
      >
        <X className="size-4" />
        Decline
      </Button>
    </div>
  );
}
