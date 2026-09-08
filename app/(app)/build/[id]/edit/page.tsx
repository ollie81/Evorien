import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProject, getProjectMembers } from "@/lib/data/projects";
import { requireUserId } from "@/lib/auth";
import { EditProjectForm } from "@/components/build/edit-project-form";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const [project, members] = await Promise.all([getProject(id), getProjectMembers(id)]);

  if (!project) notFound();

  const myMembership = members.find((m) => m.profiles?.id === userId);
  if (!myMembership || !["OWNER", "ADMIN"].includes(myMembership.role)) {
    redirect(`/build/${id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit project</h1>
      <EditProjectForm project={project} />
    </div>
  );
}
