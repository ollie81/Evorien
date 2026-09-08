"use client";

import { useState, useTransition } from "react";
import { createOpportunityAction, type CreateOpportunityFormState } from "@/actions/projects";
import { OPPORTUNITY_TYPES, opportunityTypeLabel } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NO_PROJECT = "none";

export function CreateOpportunityDialog({
  projects = [],
  lockedProject,
}: {
  /** Projects the member owns or admins — an opportunity can only be tagged to one of these. */
  projects?: { id: string; name: string }[];
  /** When set (posting from a project's own page), the opportunity is tied to this project — no picker shown. */
  lockedProject?: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result: CreateOpportunityFormState = await createOpportunityAction(undefined, formData);
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
      <DialogTrigger render={<Button size="sm">Post an opportunity</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post an opportunity</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {lockedProject ? (
            <input type="hidden" name="projectId" value={lockedProject.id} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="opp-project">Project</Label>
              <Select name="projectId" defaultValue={NO_PROJECT}>
                <SelectTrigger id="opp-project" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROJECT}>Not tied to a project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {lockedProject && (
            <p className="text-sm text-muted-foreground">
              For <span className="font-medium text-foreground">{lockedProject.name}</span>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="opp-title">Title</Label>
            <Input id="opp-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-type">Type</Label>
            <Select name="type" defaultValue="COLLABORATION">
              <SelectTrigger id="opp-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPPORTUNITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {opportunityTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-description">Description</Label>
            <Textarea id="opp-description" name="description" rows={3} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opp-location">Location (optional)</Label>
            <Input id="opp-location" name="location" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox name="isRemote" />
            Remote-friendly
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Posting…" : "Post opportunity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
