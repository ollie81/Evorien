import type { Metadata } from "next";
import { getCharterProposals, getCurrentCharter } from "@/lib/data/city";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { PublishCharterForm } from "@/components/admin/publish-charter-form";
import { CharterProposalActions } from "@/components/admin/charter-proposal-actions";

export const metadata: Metadata = { title: "Charter · Admin" };

export default async function AdminCharterPage() {
  const [charter, proposals] = await Promise.all([getCurrentCharter(), getCharterProposals()]);

  return (
    <div className="space-y-6">
      {charter && (
        <section className="space-y-3">
          <SectionHeader title="Current version" />
          <Card>
            <CardContent className="space-y-1">
              <p className="font-medium">
                {charter.version} — {charter.title}
              </p>
              <p className="line-clamp-3 text-sm text-muted-foreground">{charter.content}</p>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Publish a new version" />
        <PublishCharterForm />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Member-proposed changes" />
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proposals submitted yet.</p>
        ) : (
          <div className="space-y-2">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{proposal.title}</p>
                    <Badge variant="secondary">{proposal.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{proposal.description}</p>
                  <CharterProposalActions proposalId={proposal.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
