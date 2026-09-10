import type { MetadataRoute } from "next";

// Same public-only scope as robots.ts: every other route requires a session
// and isn't reachable by an anonymous crawler, so listing it here would
// just be a broken link from Google's perspective.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ollieen.com";
  return [
    { url: `${base}/welcome`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/sign-up`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/sign-in`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
