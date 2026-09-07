"use client";

import { useActionState, useRef } from "react";
import { addCommentAction, type AddCommentFormState } from "@/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: AddCommentFormState = undefined;

export function CommentComposer({ postId }: { postId: string }) {
  const action = addCommentAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <Textarea name="content" placeholder="Add a comment…" rows={2} />
      <div className="flex items-center justify-between">
        {state?.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
