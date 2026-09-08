"use client";

import { useState, useTransition } from "react";
import { createEventAction, type CreateEventFormState } from "@/actions/events";
import { PILLARS } from "@/lib/constants/pillars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/shared/chip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [pillar, setPillar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: CreateEventFormState = await createEventAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setPillar(null);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Host an event</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Host an event</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="pillarCode" value={pillar ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="event-title">Title</Label>
            <Input id="event-title" name="title" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-description">Description (optional)</Label>
            <Textarea id="event-description" name="description" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Pillar (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map((p) => (
                <Chip key={p.code} selected={pillar === p.code} onClick={() => setPillar(pillar === p.code ? null : p.code)}>
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-starts">Starts</Label>
              <Input id="event-starts" name="startsAt" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-ends">Ends (optional)</Label>
              <Input id="event-ends" name="endsAt" type="datetime-local" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-location">Location (optional)</Label>
            <Input id="event-location" name="location" placeholder="Address, city, or a link" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isOnline" />
            Online event
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating…" : "Create event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
