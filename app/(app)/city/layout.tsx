import { CityTabs } from "@/components/city/city-tabs";

export default function CityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">The City</h1>
      <CityTabs />
      {children}
    </div>
  );
}
