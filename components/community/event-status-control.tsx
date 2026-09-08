"use client";

import { useTransition } from "react";
import { updateEventStatusAction } from "@/actions/events";
import { Button } from "@/components/ui/button";

export function EventStatusControl({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();

  function setStatus(status: "COMPLETED" | "CANCELLED") {
    startTransition(async () => {
      await updateEventStatusAction(eventId, status);
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("COMPLETED")}>
        Mark completed
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("CANCELLED")}>
        Cancel
      </Button>
    </div>
  );
}
