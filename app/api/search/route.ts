import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { searchLimiter, checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { startTelemetryTimer } from "@/lib/telemetry/metrics";

export async function GET(request: Request) {
  const timer = startTelemetryTimer();

  // Rate limit expensive multi-table search to 30 req/min per IP
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(searchLimiter, `search:${clientIp}`);
  if (!rateLimit.allowed) {
    timer.stop({ route: "/api/search", method: "GET", status: 429 });
    return rateLimit.response!;
  }

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get("q");

  if (!rawQ || typeof rawQ !== "string") {
    const { serverTimingHeader } = timer.stop({ route: "/api/search", method: "GET", status: 200, dbDurationMs: 0 });
    return NextResponse.json({ success: true, data: [] }, { headers: { "Server-Timing": serverTimingHeader } });
  }

  // Strip PostgREST delimiters and control characters to prevent filter tree injection
  const cleanQ = rawQ.replace(/[,()%.*"'`\\]/g, " ").trim().slice(0, 100);

  if (!cleanQ) {
    const { serverTimingHeader } = timer.stop({ route: "/api/search", method: "GET", status: 200, dbDurationMs: 0 });
    return NextResponse.json({ success: true, data: [] }, { headers: { "Server-Timing": serverTimingHeader } });
  }

  const supabase = await createClient();

  const dbStartTime = performance.now();
  // Run all queries in parallel for maximum performance
  const [articlesRes, documentsRes, albumsRes, marketRes] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, excerpt, slug, created_at")
      .eq("status", "published")
      .or(`title.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%,excerpt.ilike.%${cleanQ}%`)
      .limit(5),
    supabase
      .from("official_documents")
      .select("id, title, description, file_url, created_at")
      .or(`title.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
      .limit(5),
    supabase
      .from("gallery_albums")
      .select("id, name, description, created_at")
      .or(`name.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
      .limit(5),
    supabase
      .from("products")
      .select("id, title, description, created_at")
      .eq("status", "approved")
      .or(`title.ilike.%${cleanQ}%,description.ilike.%${cleanQ}%`)
      .limit(5)
  ]);

  const results = [];

  if (articlesRes.data) {
    results.push(...articlesRes.data.map(item => ({
      id: item.id,
      type: "article",
      title: item.title,
      description: item.excerpt || "Read more about this article...",
      url: `/articles/${item.slug}`,
      date: item.created_at
    })));
  }

  if (documentsRes.data) {
    results.push(...documentsRes.data.map(item => ({
      id: item.id,
      type: "document",
      title: item.title,
      description: item.description || "Official UPSA Document",
      url: item.file_url,
      date: item.created_at
    })));
  }

  if (albumsRes.data) {
    results.push(...albumsRes.data.map(item => ({
      id: item.id,
      type: "album",
      title: item.name,
      description: item.description || "View photos from this album",
      url: `/gallery/${item.id}`,
      date: item.created_at
    })));
  }

  if (marketRes.data) {
    results.push(...marketRes.data.map(item => ({
      id: item.id,
      type: "market",
      title: item.title,
      description: item.description || "Campus Mart item",
      url: `/mart/products/${item.id}`,
      date: item.created_at
    })));
  }

  // Sort unified results by date (newest first)
  results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const dbDurationMs = Math.round(performance.now() - dbStartTime);
  const { serverTimingHeader } = timer.stop({
    route: "/api/search",
    method: "GET",
    status: 200,
    dbDurationMs,
  });

  return NextResponse.json(
    { success: true, data: results },
    {
      headers: {
        "Server-Timing": serverTimingHeader,
      },
    }
  );
}
