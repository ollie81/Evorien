import type { Metadata } from "next";
import { CreateProjectForm } from "@/components/build/create-project-form";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Start a project</h1>
        <p className="text-sm text-muted-foreground">
          Three questions. You can refine everything afterwards.
        </p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
