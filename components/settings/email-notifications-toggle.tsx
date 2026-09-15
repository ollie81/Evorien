"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setEmailNotificationsAction } from "@/actions/profile";
import { Switch } from "@/components/ui/switch";

export function EmailNotificationsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    // Optimistic, then reverted if the write fails — a toggle that visibly
    // lags behind the tap reads as broken.
    setEnabled(next);
    startTransition(async () => {
      const result = await setEmailNotificationsAction(next);
      if (result?.error) {
        setEnabled(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Email me about activity</p>
        <p className="text-sm text-muted-foreground">
          Connection requests, accepted connections, new messages and verification decisions.
          Everything else stays in-app.
        </p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label="Email me about activity"
      />
    </div>
  );
}
