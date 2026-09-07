import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components. Only ever holds the public
 * anon/publishable key — see .env.example. The service role key must never
 * reach this file or anything it imports.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
