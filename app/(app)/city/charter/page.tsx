import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { getCharterProposals, getCurrentCharter } from "@/lib/data/city";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProposeCharterChangeDialog } from "@/components/city/propose-charter-change-dialog";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export const metadata: Metadata = { title: "Charter · The City" };

export default async function CityCharterPage() {
  const [charter, proposals] = await Promise.all([getCurrentCharter(), getCharterProposals()]);

  return (
    <div className="space-y-8">
      <DisclaimerBanner>
        A community charter written and voted on by members — not a legal document, and it
        carries no authority beyond this network today.
      </DisclaimerBanner>
      {charter ? (
        <Card>
          <CardContent className="space-y-2">
            <p className="font-heading text-lg font-semibold">Freedom Charter {charter.version}</p>
            <p className="font-medium text-muted-foreground">{charter.title}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{charter.content}</p>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={NotebookPen}
          title="No charter published yet"
          message="The founding Freedom Charter will appear here once published."
        />
      )}

      <section className="space-y-3">
        <SectionHeader title="Proposed changes" action={<ProposeCharterChangeDialog />} />
        {proposals.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No proposed changes yet" />
        ) : (
          <div className="space-y-2">
            {proposals.map((p) => (
              <Card key={p.id}>
                <CardContent className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{p.title}</p>
                    <Badge variant="secondary">{p.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
