import type { Metadata } from "next";
import { Vote } from "lucide-react";
import { getGovernanceProposals } from "@/lib/data/city";
import { EmptyState } from "@/components/shared/empty-state";
import { ProposalCard } from "@/components/city/proposal-card";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export const metadata: Metadata = { title: "Governance · The City" };

export default async function CityGovernancePage() {
  const proposals = await getGovernanceProposals();

  return (
    <div className="space-y-6">
      <DisclaimerBanner>
        Community votes here are member decisions — not government elections and not legally
        binding today.
      </DisclaimerBanner>
      {proposals.length === 0 ? (
        <EmptyState icon={Vote} title="No community proposals yet" />
      ) : (
        <div className="space-y-2">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
