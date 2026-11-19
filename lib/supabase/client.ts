import { createBrowserClient } from "@supabase/ssr";

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

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      global: {
        fetch: safeFetch,
      },
    }
  );
}
