"use client";

import { useActionState } from "react";
import { publishCharterVersionAction, type PublishCharterVersionFormState } from "@/actions/city";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: PublishCharterVersionFormState = undefined;

export function PublishCharterForm() {
  const [state, formAction, pending] = useActionState(publishCharterVersionAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input id="version" name="version" placeholder="v0.2" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Ollieen Freedom Charter" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Full text</Label>
        <Textarea id="content" name="content" rows={10} required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Publishing…" : "Publish as current version"}
      </Button>
    </form>
  );
}
