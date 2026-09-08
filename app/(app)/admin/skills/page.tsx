import type { Metadata } from "next";
import { Award } from "lucide-react";
import { getAllProfileSkills } from "@/lib/data/admin";
import { profileDisplayName } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SkillVerificationActions } from "@/components/admin/skill-verification-actions";

export const metadata: Metadata = { title: "Skills · Admin" };

export default async function AdminSkillsPage() {
  const rows = await getAllProfileSkills();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No skills claimed yet"
        message="Skills members add to their Passport will appear here for review."
      />
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <Card key={row.id}>
          <CardContent className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{row.skill?.name ?? "Skill"}</p>
              <p className="text-sm text-muted-foreground">
                {row.profile ? profileDisplayName(row.profile) : "A member"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {row.is_verified && <Badge>Verified</Badge>}
              <SkillVerificationActions profileSkillId={row.id} isVerified={row.is_verified} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
