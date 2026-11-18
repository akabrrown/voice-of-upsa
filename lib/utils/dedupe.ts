import { cache } from "react";

/**
 * Request Deduplication Utility (Pillar B)
 * Prevents multiple identical requests from running concurrently.
 */

// In-flight promise registry for concurrent server operations
const inFlightPromises = new Map<string, Promise<unknown>>();

export interface InFlightLockOptions {
  /**
   * "wait": Second request shares the promise of the first (ideal for identical read/compute queries).
   * "reject": Second request fails immediately with conflict (ideal for financial, mutations, or double-clicks).
   */
  behavior?: "wait" | "reject";
  timeoutMs?: number;
}

export class DuplicateRequestError extends Error {
  constructor(message = "Action already in progress. Please wait a moment.") {
    super(message);
    this.name = "DuplicateRequestError";
  }
}

/**
 * Executes an async task while preventing duplicate execution for the same key.
 */
export async function withInFlightLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: InFlightLockOptions = { behavior: "wait", timeoutMs: 15000 }
): Promise<T> {
  const existing = inFlightPromises.get(key);

  if (existing) {
    if (options.behavior === "reject") {
      throw new DuplicateRequestError();
    }
    return existing as Promise<T>;
  }

  const timeoutMs = options.timeoutMs || 15000;
  let timer: NodeJS.Timeout | null = null;

  const promise = (async () => {
    try {
      return await fn();
    } finally {
      if (timer) clearTimeout(timer);
      inFlightPromises.delete(key);
    }
  })();

  // Safety fallback: auto-clear key after timeout to avoid hanging locks
  timer = setTimeout(() => {
    inFlightPromises.delete(key);
  }, timeoutMs);

  inFlightPromises.set(key, promise);
  return promise;
}

/**
 * Server Component Request Deduplication wrapper.
 * Deduplicates multiple calls to the same data function within a single render pass
 * (e.g. generateMetadata and Page component querying the same article).
 */
export function dedupeServerQuery<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<T> {
  return cache(fn);
}

// Client-side in-flight fetch deduplication map
const clientInFlightFetches = new Map<string, Promise<Response>>();

/**
 * Client-side deduplicating fetch: if multiple components request the same GET URL simultaneously,
 * sends only one network request and clones the response for each caller.
 */
export async function dedupedClientFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = (init?.method || "GET").toUpperCase();

  // Only deduplicate idempotent GET requests
  if (method !== "GET") {
    return fetch(input, init);
  }

  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const existing = clientInFlightFetches.get(url);

  if (existing) {
    const res = await existing;
    return res.clone();
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(input, init);
      return res;
    } finally {
      clientInFlightFetches.delete(url);
    }
  })();

  clientInFlightFetches.set(url, fetchPromise);
  const response = await fetchPromise;
  return response.clone();
}
