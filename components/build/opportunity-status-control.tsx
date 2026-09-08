"use client";

import { useTransition } from "react";
import { updateOpportunityStatusAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";

export function OpportunityStatusControl({ opportunityId, status }: { opportunityId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  function setStatus(next: "OPEN" | "FILLED" | "CLOSED") {
    startTransition(async () => {
      await updateOpportunityStatusAction(opportunityId, next);
    });
  }

  if (status === "OPEN") {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("FILLED")}>
          Mark filled
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("CLOSED")}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => setStatus("OPEN")}>
      Reopen
    </Button>
  );
}
