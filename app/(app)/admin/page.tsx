import type { Metadata } from "next";
import Link from "next/link";
import { Award, Flag, ShieldCheck } from "lucide-react";
import { getOpenReportCount, getPendingVerificationCount, getUnverifiedSkillCount } from "@/lib/data/admin";
import { getNetworkStats } from "@/lib/data/home";
import { Card, CardContent } from "@/components/ui/card";
import { StatTile } from "@/components/shared/stat-tile";

export const metadata: Metadata = { title: "Admin Overview" };

export default async function AdminOverviewPage() {
  const [reportCount, verificationCount, unverifiedSkillCount, stats] = await Promise.all([
    getOpenReportCount(),
    getPendingVerificationCount(),
    getUnverifiedSkillCount(),
    getNetworkStats(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <StatTile value={stats.member_count} label="Members" />
          <StatTile value={stats.active_project_count} label="Active projects" />
          <StatTile value={stats.country_count} label="Countries" />
          <StatTile value={stats.verified_contributor_count} label="Verified" />
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/verifications">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center gap-3">
              <ShieldCheck className="size-8 text-primary" strokeWidth={1.5} />
              <div>
                <p className="text-2xl font-semibold">{verificationCount}</p>
                <p className="text-sm text-muted-foreground">Pending verification requests</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/skills">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center gap-3">
              <Award className="size-8 text-primary" strokeWidth={1.5} />
              <div>
                <p className="text-2xl font-semibold">{unverifiedSkillCount}</p>
                <p className="text-sm text-muted-foreground">Unverified skills</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/reports">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center gap-3">
              <Flag className="size-8 text-primary" strokeWidth={1.5} />
              <div>
                <p className="text-2xl font-semibold">{reportCount}</p>
                <p className="text-sm text-muted-foreground">Open reports</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
