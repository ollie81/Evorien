import "server-only";

import { headers } from "next/headers";

/**
 * The origin Supabase Auth should redirect back to after email
 * confirmation, password recovery, or Google OAuth. Set NEXT_PUBLIC_SITE_URL
 * in Vercel's environment variables (Production) to Ollieen's real
 * deployed URL — https://ollieen.com once that domain is connected and
 * verified (README: "Connect ollieen.com"), https://evorien.vercel.app
 * until then (the Vercel-assigned domain — unaffected by the product
 * rename) — and it becomes the source of truth — pinned, not inferred,
 * so it can never come out wrong regardless of how a given request reaches
 * Vercel's proxy. Local development has no such variable, so it falls back
 * to whatever the incoming request's own origin/host is (http://localhost:3000).
 *
 * This only decides what URL Ollieen *asks* Supabase to redirect to. It
 * still has to exactly match an entry in Supabase's own Redirect URLs
 * allow list (Authentication -> URL Configuration) — if it doesn't,
 * Supabase silently redirects to its Site URL instead of erroring, which
 * is the actual mechanism behind "redirects to localhost in production."
 */
export async function getSiteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const headerList = await headers();
  return headerList.get("origin") ?? `https://${headerList.get("host")}`;
}
