"use client";

import { useActionState, useRef, useState } from "react";
import { createPostAction, type CreatePostFormState } from "@/actions/community";
import { PILLARS } from "@/lib/constants/pillars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Chip } from "@/components/shared/chip";

const initialState: CreatePostFormState = undefined;

export function PostComposer() {
  const [state, formAction, pending] = useActionState(createPostAction, initialState);
  const [pillar, setPillar] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
        setPillar(null);
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <input type="hidden" name="pillarCode" value={pillar ?? ""} />
      <Textarea
        name="content"
        placeholder="Share progress, ask for help, celebrate a win…"
        rows={3}
        maxLength={5000}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PILLARS.map((p) => (
            <Chip key={p.code} selected={pillar === p.code} onClick={() => setPillar(pillar === p.code ? null : p.code)}>
              {p.name}
            </Chip>
          ))}
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
