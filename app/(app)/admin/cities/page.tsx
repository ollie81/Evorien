import type { Metadata } from "next";
import { getCities } from "@/lib/data/city";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { CreateCityForm } from "@/components/admin/create-city-form";
import { CityStatusSelect } from "@/components/admin/city-status-select";

export const metadata: Metadata = { title: "Cities · Admin" };

export default async function AdminCitiesPage() {
  const cities = await getCities();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionHeader title="Add a location" />
        <CreateCityForm />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Existing locations" />
        {cities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing announced yet — add the first one above.</p>
        ) : (
          <div className="space-y-2">
            {cities.map((city) => (
              <Card key={city.id}>
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{city.name}</p>
                    <p className="text-sm text-muted-foreground">{city.country}</p>
                  </div>
                  <CityStatusSelect cityId={city.id} status={city.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
