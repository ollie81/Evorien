import type { Metadata } from "next";
import { Vote } from "lucide-react";
import { getGovernanceProposals } from "@/lib/data/city";
import { EmptyState } from "@/components/shared/empty-state";
import { ProposalCard } from "@/components/city/proposal-card";

export const metadata: Metadata = { title: "Governance · The City" };

export default async function CityGovernancePage() {
  const proposals = await getGovernanceProposals();

  if (proposals.length === 0) {
    return (
      <EmptyState
        icon={Vote}
        title="No community proposals yet"
        message="Community votes here are member decisions — not government elections and not legally binding today."
      />
    );
  }

  return (
    <div className="space-y-2">
      {proposals.map((proposal) => (
        <ProposalCard key={proposal.id} proposal={proposal} />
      ))}
    </div>
  );
}
