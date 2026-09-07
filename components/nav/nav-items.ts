import { Compass, Hammer, Home, IdCard, Landmark } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/build", label: "Build", icon: Hammer },
  { href: "/city", label: "City", icon: Landmark },
  { href: "/passport", label: "Passport", icon: IdCard },
] as const;
