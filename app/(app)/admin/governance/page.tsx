import type { Metadata } from "next";
import { getGovernanceProposals } from "@/lib/data/city";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { CreateProposalForm } from "@/components/admin/create-proposal-form";

export const metadata: Metadata = { title: "Governance · Admin" };

export default async function AdminGovernancePage() {
  const proposals = await getGovernanceProposals();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionHeader title="Open a new proposal for voting" />
        <CreateProposalForm />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Existing proposals" />
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proposals yet.</p>
        ) : (
          <div className="space-y-2">
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <p className="font-medium">{proposal.title}</p>
                  <Badge variant="secondary">{proposal.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
