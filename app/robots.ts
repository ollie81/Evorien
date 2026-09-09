import type { MetadataRoute } from "next";

// Everything under (app)/** requires a session and redirects an anonymous
// crawler straight to /welcome anyway (see lib/supabase/middleware.ts) — so
// there's no real content there for Google to index, only wasted crawl
// budget on redirects. Only the genuinely public, signed-out pages are
// listed as allowed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/welcome", "/sign-in", "/sign-up", "/forgot-password"],
      disallow: "/",
    },
    sitemap: "https://ollieen.com/sitemap.xml",
  };
}
