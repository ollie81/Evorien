import { CityTabs } from "@/components/city/city-tabs";
import { DisclaimerBanner } from "@/components/city/disclaimer-banner";

export default function CityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">The City</h1>
      <DisclaimerBanner>
        Everything on this page describes Ollieen&apos;s long-term vision for physical
        communities — a possible future, not something operating today. The rest of the app
        (Home, Discover, Build, Passport) is the real, current network.
      </DisclaimerBanner>
      <CityTabs />
      {children}
    </div>
  );
}
