"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { dismissReportAction, resolveReportAction } from "@/actions/reports";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<void>) {
    startTransition(async () => {
      try {
        await action(reportId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(resolveReportAction)}>
        Resolve
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(dismissReportAction)}>
        Dismiss
      </Button>
    </div>
  );
}
