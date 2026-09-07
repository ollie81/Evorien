import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions, and Route
 * Handlers. Create a fresh one per request — never share across requests.
 *
 * Reads/writes the session via cookies so the same signed-in session works
 * on both server and client. Row Level Security (see supabase/migrations)
 * is what actually authorizes every query this client makes — this file
 * only wires up the session, it grants no special access.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, which can't set
            // cookies. Harmless: proxy.ts refreshes the session cookie on
            // every request, so the session still stays in sync.
          }
        },
      },
    }
  );
}
