import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck } from "lucide-react";
import {
  getEvidenceSignedUrl,
  getPendingVerifications,
  getRecentlyReviewedVerifications,
  type AdminVerificationRequest,
} from "@/lib/data/admin";
import { profileDisplayName } from "@/lib/types";
import { verificationLevelLabel } from "@/lib/constants/roles";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { VerificationReviewActions } from "@/components/admin/verification-review-actions";

export const metadata: Metadata = { title: "Verification · Admin" };

export default async function AdminVerificationsPage() {
  const [requests, reviewed] = await Promise.all([getPendingVerifications(), getRecentlyReviewedVerifications()]);

  const withEvidence = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      evidenceUrl: request.evidence_path ? await getEvidenceSignedUrl(request.evidence_path) : null,
    }))
  );

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <SectionHeader title="Pending" subtitle="Requests waiting for a decision." />
        {withEvidence.length === 0 ? (
          <EmptyState icon={FileCheck} title="No pending requests" message="Nothing needs review right now." />
        ) : (
          <div className="space-y-2">
            {withEvidence.map((request) => (
              <Card key={request.id}>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {request.profile ? profileDisplayName(request.profile) : "A member"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{request.profile_id}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(request.created_at)}
                    </span>
                  </div>
                  <Badge variant="secondary">{verificationLevelLabel(request.requested_level)}</Badge>
                  {request.notes && <p className="text-sm text-muted-foreground">{request.notes}</p>}
                  {request.evidenceUrl && (
                    <Link
                      href={request.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary underline underline-offset-4"
                    >
                      View evidence
                    </Link>
                  )}
                  <VerificationReviewActions
                    verificationId={request.id}
                    profileId={request.profile_id}
                    requestedLevel={request.requested_level}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-2">
          <SectionHeader title="Recently reviewed" subtitle="What was already decided." />
          <div className="space-y-2">
            {reviewed.map((request: AdminVerificationRequest) => (
              <Card key={request.id}>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {request.profile ? profileDisplayName(request.profile) : "A member"}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{request.profile_id}</p>
                    </div>
                    <Badge variant={request.status === "APPROVED" ? "default" : "destructive"}>
                      {request.status}
                    </Badge>
                  </div>
                  <Badge variant="secondary">{verificationLevelLabel(request.requested_level)}</Badge>
                  {request.rejection_reason && (
                    <p className="text-sm text-muted-foreground">Reason: {request.rejection_reason}</p>
                  )}
                  {request.reviewed_at && (
                    <p className="text-xs text-muted-foreground">Reviewed {formatDistanceToNow(request.reviewed_at)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
