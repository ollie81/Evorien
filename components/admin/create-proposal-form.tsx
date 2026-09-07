"use client";

import { useActionState } from "react";
import { createProposalAction, type CreateProposalFormState } from "@/actions/city";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: CreateProposalFormState = undefined;

export function CreateProposalForm() {
  const [state, formAction, pending] = useActionState(createProposalAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="options">Options</Label>
        <Textarea id="options" name="options" rows={3} placeholder={"Yes\nNo"} required />
        <p className="text-xs text-muted-foreground">One option per line, at least two.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="votingDays">Voting period (days)</Label>
        <Input id="votingDays" name="votingDays" type="number" min={1} max={90} defaultValue={7} />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Open for voting"}
      </Button>
    </form>
  );
}
