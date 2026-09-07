import type { Metadata } from "next";
import { CreateProjectForm } from "@/components/build/create-project-form";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New project</h1>
      <CreateProjectForm />
    </div>
  );
}
