import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { opportunityTypeLabel } from "@/lib/constants/roles";
import { profileDisplayName } from "@/lib/types";
import type { Opportunity } from "@/lib/types";
import type { OpportunityApplication } from "@/lib/data/projects";
import { ApplyButton } from "@/components/build/apply-button";
import { ApplicationReviewActions } from "@/components/build/application-review-actions";

export function OpportunityCard({
  opportunity,
  viewerId,
  myApplication,
  applications,
}: {
  opportunity: Opportunity;
  viewerId: string | null;
  myApplication?: { id: string; status: string } | null;
  applications?: OpportunityApplication[];
}) {
  const isOwner = viewerId !== null && viewerId === opportunity.posted_by;

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-medium">{opportunity.title}</p>
            <p className="text-sm text-muted-foreground">
              {opportunityTypeLabel(opportunity.type)}
              {opportunity.location && ` · ${opportunity.location}`}
              {opportunity.is_remote && " · Remote"}
            </p>
          </div>
          <Badge variant={opportunity.status === "OPEN" ? "secondary" : "outline"}>{opportunity.status}</Badge>
        </div>
        {opportunity.description && (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{opportunity.description}</p>
        )}
        {!isOwner && viewerId && opportunity.status === "OPEN" && (
          <ApplyButton opportunityId={opportunity.id} initialApplication={myApplication ?? null} />
        )}
        {isOwner && applications && applications.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">Applicants</p>
            {applications.map((application) => (
              <div key={application.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {application.applicant ? profileDisplayName(application.applicant) : "Member"}
                  </p>
                  {application.message && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{application.message}</p>
                  )}
                </div>
                {application.status === "SUBMITTED" || application.status === "REVIEWED" ? (
                  <ApplicationReviewActions applicationId={application.id} />
                ) : (
                  <Badge
                    variant={
                      application.status === "ACCEPTED"
                        ? "default"
                        : application.status === "WITHDRAWN"
                          ? "outline"
                          : "destructive"
                    }
                    className="shrink-0"
                  >
                    {application.status}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
