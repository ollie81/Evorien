import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Reachable without a session. A signed-out visit to anything else lands on
// /welcome — the vision pitch — rather than a bare sign-in form with no
// context; a signed-in visit to any of these bounces to the dashboard.
const PUBLIC_PAGES = ["/sign-in", "/sign-up", "/welcome"];

/**
 * Optimistic auth check, run on every request by proxy.ts. It only reads
 * the session from cookies (no database query) and refreshes the token if
 * needed — per Next.js's own guidance, proxy/middleware should never do
 * database-backed authorization checks. The real, secure checks (RLS on
 * every Supabase call, plus the onboarding-completed redirect) happen
 * server-side, close to the data, in the (app) layout and Server Actions.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  const pathname = request.nextUrl.pathname;
  const isPublicPage = PUBLIC_PAGES.includes(pathname);

  if (!claims && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/welcome";
    return NextResponse.redirect(url);
  }

  if (claims && isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
