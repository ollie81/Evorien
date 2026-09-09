import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Only ever a same-origin relative path — guards against an open redirect via `next`. */
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/**
 * Shared landing point for every Supabase redirect-based auth flow: email
 * confirmation, password recovery, and Google OAuth all send the browser
 * here with a PKCE `code`. Exempted from the auth gate in
 * lib/supabase/middleware.ts, since a visitor here is by definition not
 * signed in yet.
 *
 * Email confirmation and Google OAuth both land on the default `next`
 * (`/`) and let the existing (app) layout gate route new vs. returning
 * users; password recovery passes `next=/reset-password` explicitly.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Never forward Supabase/provider error text verbatim — map to a small,
  // fixed set of reason codes so /sign-in can show a friendly message
  // without ever surfacing internal error strings.
  const providerError = searchParams.get("error");
  const reason = providerError === "access_denied" ? "oauth_denied" : "confirmation_failed";
  return NextResponse.redirect(`${origin}/sign-in?authError=${reason}`);
}
