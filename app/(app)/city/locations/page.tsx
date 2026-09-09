import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getCities } from "@/lib/data/city";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export const metadata: Metadata = { title: "Locations · The City" };

export default async function CityLocationsPage() {
  const cities = await getCities();

  return (
    <div className="space-y-6">
      <DisclaimerBanner>
        Ollieen is location-agnostic and may eventually support multiple communities. A status
        below — including &quot;Operational&quot; — describes progress on a proposal, never a
        claim that Ollieen currently owns land or operates a city.
      </DisclaimerBanner>
      {cities.length === 0 ? (
        <EmptyState icon={MapPin} title="No locations announced yet" message="Nothing is announced today." />
      ) : (
        <div className="space-y-2">
          {cities.map((city) => (
            <Card key={city.id}>
              <CardContent className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{city.name}</p>
                  <Badge variant="secondary">{city.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{city.country}</p>
                {city.description && <p className="text-sm">{city.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
