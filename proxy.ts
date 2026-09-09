import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the "middleware" file convention to "proxy" — this is
// not a typo. See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, manifest.webmanifest,
     *   opengraph-image (metadata files/routes — fetched by browsers,
     *   link-preview scrapers, and "add to home screen" flows with no
     *   session at all, so gating them behind auth breaks their purpose
     *   rather than protecting anything)
     * - files with an extension (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
