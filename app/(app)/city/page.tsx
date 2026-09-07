import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export const metadata: Metadata = { title: "Vision · The City" };

const PRINCIPLES = [
  "Freedom of expression",
  "Privacy",
  "Property rights",
  "Due process",
  "Freedom of association",
  "Business freedom",
  "Transparent institutions",
  "Limits on concentrated power",
];

export default function CityVisionPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-heading text-xl font-semibold">Beyond the network</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Evorien&apos;s long-term vision is to help develop high-autonomy communities — places
          built by the same ambitious builders, artists and founders who make up this network. The
          physical city is a long-term goal: everything in the Evorien Network is designed to be
          valuable on its own, whether or not a physical community is ever built.
        </p>
      </div>

      <DisclaimerBanner>
        Evorien does not currently control any territory and has no government partnerships unless
        explicitly announced. Any future physical development would operate under the laws of its
        host country.
      </DisclaimerBanner>

      <section className="space-y-3">
        <SectionHeader
          title="Proposed principles"
          subtitle="A starting point for community discussion — see the Charter."
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <Card key={principle}>
              <CardContent className="flex items-center gap-2.5">
                <CircleCheck className="size-4 shrink-0 text-muted-foreground" />
                <span>{principle}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <DisclaimerBanner>
        These are proposed community principles, not laws. They cannot override the laws of any
        host country and carry no legal authority today.
      </DisclaimerBanner>
    </div>
  );
}
