import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export const metadata: Metadata = { title: "Roadmap · The City" };

const PHASES = [
  {
    number: "1",
    name: "Seed Village",
    hectares: "~50–100 hectares",
    features: [
      "Housing",
      "Coworking",
      "Maker spaces",
      "Solar energy",
      "Digital infrastructure",
      "Small businesses",
      "Community spaces",
    ],
  },
  {
    number: "2",
    name: "Town",
    hectares: "~500–2,000 hectares",
    features: [
      "Commercial district",
      "Entertainment",
      "Arts",
      "Tourism",
      "Expanded housing",
      "Education",
      "Regional transportation",
    ],
  },
  {
    number: "3",
    name: "Metropolis",
    hectares: "~5,000–20,000+ hectares",
    features: [
      "Large residential areas",
      "Technology district",
      "International businesses",
      "Arts and entertainment districts",
      "Tourism infrastructure",
      "Major transportation",
    ],
  },
];

export default function CityRoadmapPage() {
  return (
    <div className="space-y-6">
      <DisclaimerBanner>
        PROPOSED FUTURE DEVELOPMENT. No location has been selected. This is a framework for how a
        future Evorien community could grow, not a description of anything currently underway.
      </DisclaimerBanner>

      <div className="space-y-4">
        {PHASES.map((phase) => (
          <Card key={phase.number}>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-semibold text-primary">
                  {phase.number}
                </span>
                <div>
                  <p className="font-heading font-semibold">
                    Phase {phase.number} — {phase.name}
                  </p>
                  <p className="text-sm text-muted-foreground">{phase.hectares}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {phase.features.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
