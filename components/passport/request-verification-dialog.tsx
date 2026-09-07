"use client";

import { useId, useState, useTransition } from "react";
import { requestVerificationAction } from "@/actions/verifications";
import { createClient } from "@/lib/supabase/client";
import { verificationLevelLabel } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const LEVELS = ["IDENTITY_VERIFIED", "SKILL_VERIFIED", "FOUNDER_VERIFIED"];

export function RequestVerificationDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [evidencePath, setEvidencePath] = useState("");
  const fileInputId = useId();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const supabase = createClient();
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("verification-evidence").upload(path, file);
      if (uploadErr) throw uploadErr;
      setEvidencePath(path);
    } catch {
      setUploadError("Could not upload that file. Try a smaller file or a different format.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await requestVerificationAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setEvidencePath("");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm">Request verification</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request verification</DialogTitle>
          <DialogDescription>
            An admin will review your request. Evidence you upload is private — only you and
            reviewing admins can see it.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="evidencePath" value={evidencePath} />
          <div className="space-y-2">
            <Label htmlFor="requestedLevel">Level</Label>
            <Select name="requestedLevel" defaultValue={LEVELS[0]}>
              <SelectTrigger id="requestedLevel" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {verificationLevelLabel(level)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Anything that helps a reviewer, e.g. links to your work"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={fileInputId}>Evidence (optional)</Label>
            <input
              id={fileInputId}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
            {evidencePath && !uploading && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">File attached.</p>
            )}
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending || uploading} className="w-full">
            {pending ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
