import { CircleCheck } from "lucide-react";
import { getMyVote, getProposalOptions, getProposalResults } from "@/lib/data/city";
import { getUserId } from "@/lib/auth";
import type { GovernanceProposal } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteButton } from "@/components/city/vote-button";

export async function ProposalCard({ proposal }: { proposal: GovernanceProposal }) {
  const [options, results, userId] = await Promise.all([
    getProposalOptions(proposal.id),
    getProposalResults(proposal.id),
    getUserId(),
  ]);
  const myVote = await getMyVote(proposal.id, userId);
  const isActive = proposal.status === "ACTIVE";

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium">{proposal.title}</p>
          <Badge variant="secondary">{proposal.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{proposal.description}</p>
        <div className="space-y-2 pt-1">
          {options.map((option) => {
            const count = results.find((r) => r.option_id === option.id)?.vote_count ?? 0;
            const votedForThis = myVote === option.id;
            return (
              <div key={option.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {option.label} · {count} votes
                </span>
                {isActive && userId && !myVote && (
                  <VoteButton proposalId={proposal.id} optionId={option.id} />
                )}
                {votedForThis && <CircleCheck className="size-4 text-emerald-500" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
