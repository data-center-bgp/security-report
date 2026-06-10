import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";

/**
 * Browser (client-side) Supabase client.
 * Safe to use in Client Components and anywhere without `next/headers`.
 */
export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
