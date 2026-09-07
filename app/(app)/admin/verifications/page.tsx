import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck } from "lucide-react";
import { getEvidenceSignedUrl, getPendingVerifications } from "@/lib/data/admin";
import { profileDisplayName } from "@/lib/types";
import { verificationLevelLabel } from "@/lib/constants/roles";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { VerificationReviewActions } from "@/components/admin/verification-review-actions";

export const metadata: Metadata = { title: "Verification · Admin" };

export default async function AdminVerificationsPage() {
  const requests = await getPendingVerifications();

  if (requests.length === 0) {
    return (
      <EmptyState icon={FileCheck} title="No pending requests" message="Nothing needs review right now." />
    );
  }

  const withEvidence = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      evidenceUrl: request.evidence_path ? await getEvidenceSignedUrl(request.evidence_path) : null,
    }))
  );

  return (
    <div className="space-y-2">
      {withEvidence.map((request) => (
        <Card key={request.id}>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <p className="font-medium">
                {request.profile ? profileDisplayName(request.profile) : "A member"}
              </p>
              <span className="text-xs text-muted-foreground">
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
  );
}
