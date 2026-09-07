"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { createReportAction } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS = [
  "Spam",
  "Harassment or abuse",
  "Misinformation",
  "Impersonation",
  "Not related to Evorien",
  "Other",
];

export function ReportDialog({
  targetType,
  targetId,
}: {
  targetType: "POST" | "COMMENT" | "PROFILE" | "PROJECT" | "OPPORTUNITY";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createReportAction(targetType, targetId, undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <Flag className="size-3.5" />
            Report
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select name="reason" defaultValue={REASONS[0]}>
              <SelectTrigger id="reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Details (optional)</Label>
            <Textarea id="details" name="details" rows={3} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Submitting…" : "Submit report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
