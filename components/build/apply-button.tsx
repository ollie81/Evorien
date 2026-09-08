"use client";

import { useState, useTransition } from "react";
import { Check, Clock, X } from "lucide-react";
import { applyToOpportunityAction, withdrawApplicationAction, type ApplyActionState } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ApplyButton({
  opportunityId,
  initialApplication,
}: {
  opportunityId: string;
  initialApplication: { id: string; status: string } | null;
}) {
  const [application, setApplication] = useState(initialApplication);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (application?.status === "ACCEPTED" || application?.status === "REJECTED") {
    return (
      <Button variant="ghost" size="sm" disabled>
        {application.status === "ACCEPTED" ? <Check className="size-4" /> : <X className="size-4" />}
        {application.status === "ACCEPTED" ? "Accepted" : "Not selected"}
      </Button>
    );
  }

  if (application?.status === "SUBMITTED" || application?.status === "REVIEWED") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <Clock className="size-4" />
            Applied
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await withdrawApplicationAction(application.id);
                if (result?.error) {
                  setError(result.error);
                } else {
                  setApplication({ ...application, status: "WITHDRAWN" });
                }
              });
            }}
          >
            <X className="size-4" />
            Withdraw
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Apply</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply to this opportunity</DialogTitle>
        </DialogHeader>
        <form
          action={(formData: FormData) => {
            const message = String(formData.get("message") ?? "").trim();
            startTransition(async () => {
              const result: ApplyActionState = await applyToOpportunityAction(opportunityId, message);
              if (result?.error) {
                setError(result.error);
              } else if (result?.id) {
                setError(null);
                setApplication({ id: result.id, status: "SUBMITTED" });
                setOpen(false);
              }
            });
          }}
          className="space-y-4"
        >
          <Textarea name="message" placeholder="Say a little about why you'd be a good fit (optional)" rows={3} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Send application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
