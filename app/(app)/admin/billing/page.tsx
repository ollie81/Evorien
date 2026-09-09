import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { getMembersWithPlans } from "@/lib/data/admin";
import { profileDisplayName } from "@/lib/types";
import { planLabel, type SubscriptionPlan } from "@/lib/billing/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MemberPlanControl } from "@/components/admin/member-plan-control";

export const metadata: Metadata = { title: "Billing · Admin" };

export default async function AdminBillingPage() {
  const members = await getMembersWithPlans();

  if (members.length === 0) {
    return <EmptyState icon={CreditCard} title="No members yet" message="Member plans will show up here." />;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Manually grant or revoke Ollieen Pro. There&apos;s no payment provider wired up yet — this is
        how early members get Pro until real billing exists.
      </p>
      {members.map((member) => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <p className="font-medium">{profileDisplayName(member)}</p>
              {member.plan !== "FREE" && (
                <Badge variant="secondary">{planLabel(member.plan as SubscriptionPlan)}</Badge>
              )}
            </div>
            <MemberPlanControl profileId={member.id} plan={member.plan} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
