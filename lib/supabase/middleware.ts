import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Reachable without a session. A signed-out visit to anything else lands on
// /welcome — the vision pitch — rather than a bare sign-in form with no
// context; a signed-in visit to any of these bounces to the dashboard.
// /reset-password is deliberately NOT here: it's only ever reached with a
// real (recovery) session from /auth/callback, so it must not bounce a
// signed-in visitor away — the page itself checks for a session instead.
const PUBLIC_PAGES = ["/sign-in", "/sign-up", "/welcome", "/forgot-password"];

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

  // API routes (app/api/**/route.ts) return their own JSON error responses
  // for signed-out/unauthorized requests — see e.g. app/api/ai/chat/route.ts.
  // Redirecting them to a page here, before they even run, would turn a
  // fetch() call expecting JSON into an HTML redirect response instead.
  //
  // /auth/callback is exempted the same way: a person clicking an email
  // confirmation, password recovery, or Google OAuth link is by definition
  // not signed in yet, so the generic "no claims -> /welcome" bounce below
  // would otherwise fire before the route's own code-exchange logic ever
  // runs, silently discarding the code. The route handles every outcome
  // (success, error, missing code) itself and issues its own redirect.
  //
  // /reset-password needs the same exemption for the opposite reason: it
  // can't go in PUBLIC_PAGES (that would bounce away the signed-in
  // recovery session it's meant for), but that also means a signed-out
  // visitor with no session at all would otherwise hit the generic
  // "no claims -> /welcome" bounce below before the page's own, more
  // specific "no session -> /forgot-password" check ever got to run.
  if (pathname.startsWith("/api/") || pathname === "/auth/callback" || pathname === "/reset-password") {
    return supabaseResponse;
  }

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
