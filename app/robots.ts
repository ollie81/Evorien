import type { MetadataRoute } from "next";

// Allow every crawler (search engines and AI tools) to read the whole site.
// Signed-in routes still redirect anonymous visitors to /welcome, and pages
// that must stay out of search results opt out with their own `robots`
// metadata (e.g. app/join/[code]/page.tsx).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.ollieen.com/sitemap.xml",
  };
}
