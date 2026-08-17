import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// IMPORTANT: all three generic parameters (Database, SchemaName, Schema) are
// specified explicitly. Supplying only `<Database>` and letting the other
// two fall back to their default type expressions is what was silently
// causing supabase.from(...).update()/.insert() to resolve to `never` —
// the default-parameter chain (SchemaName -> "public", Schema ->
// Database["public"]) wasn't collapsing to our actual types. Being fully
// explicit here removes that ambiguity for every file that imports
// SupabaseBrowserClient.
export type SupabaseBrowserClient = SupabaseClient<Database, "public">;

let browserClient: SupabaseBrowserClient | null = null;

/**
 * Browser-side Supabase client. Uses only the public URL + anon key —
 * never import or reference SUPABASE_SERVICE_ROLE_KEY from client code.
 * Session is persisted automatically (localStorage) by supabase-js.
 */
export function getSupabaseBrowserClient(): SupabaseBrowserClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env.local and fill in your Supabase project's values."
    );
  }

  browserClient = createClient<Database, "public">(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return browserClient;
}
