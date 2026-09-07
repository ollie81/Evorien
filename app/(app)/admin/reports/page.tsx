import type { Metadata } from "next";
import { Flag } from "lucide-react";
import { getOpenReports } from "@/lib/data/admin";
import { profileDisplayName } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/format-date";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportActions } from "@/components/admin/report-actions";

export const metadata: Metadata = { title: "Reports · Admin" };

export default async function AdminReportsPage() {
  const reports = await getOpenReports();

  if (reports.length === 0) {
    return <EmptyState icon={Flag} title="No open reports" message="Nothing needs review right now." />;
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{report.target_type}</Badge>
                <span className="font-medium">{report.reason}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(report.created_at)}
              </span>
            </div>
            {report.details && <p className="text-sm text-muted-foreground">{report.details}</p>}
            <p className="text-xs text-muted-foreground">
              Reported by {report.reporter ? profileDisplayName(report.reporter) : "a member"} ·
              target id <code className="font-mono">{report.target_id}</code>
            </p>
            <ReportActions reportId={report.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
