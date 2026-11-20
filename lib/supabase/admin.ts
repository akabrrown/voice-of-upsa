import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Database Connection Management (Pillar C)
 * Reuses Supabase PostgREST client instances across invocations to avoid
 * re-establishing TCP & TLS connections for every HTTP request.
 */

let adminClientInstance: SupabaseClient | null = null;
let publicClientInstance: SupabaseClient | null = null;

const safeFetch: typeof fetch = (input, init) => {
  const urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

  if (urlStr.includes("placeholder-url.supabase.co")) {
    return Promise.resolve(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
  }

  return fetch(input, {
    ...init,
    signal: init?.signal || AbortSignal.timeout(10000),
  });
};

/**
 * Returns a pooled Supabase client with administrative / service-role privileges.
 * Lazily instantiated to prevent premature module evaluation errors during Next.js builds.
 */
export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-service-role-key";

  if (!adminClientInstance) {
    adminClientInstance = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: safeFetch,
      },
    });
  }

  return adminClientInstance;
}

/**
 * Returns a pooled Supabase client with public anon privileges for server-side read paths.
 */
export function getPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  if (!publicClientInstance) {
    publicClientInstance = createSupabaseClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        fetch: safeFetch,
      },
    });
  }

  return publicClientInstance;
}
