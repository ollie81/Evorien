"use client";

import { AlertTriangle } from "lucide-react";
import { deleteAccountAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export function DeleteAccountButton() {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="destructive">
          <AlertTriangle className="size-4" />
          Delete your Ollieen account
        </Button>
      }
      title="Delete your Ollieen account?"
      description="This permanently deletes your Ollieen Passport, chat history, AI memory, connections, and usage data. Projects, posts, or organizations you created will remain visible to other members, shown as created by a deleted user. This cannot be undone."
      confirmLabel="Delete my account"
      onConfirm={async () => {
        const result = await deleteAccountAction();
        if (result?.error) throw new Error(result.error);
      }}
    />
  );
}
