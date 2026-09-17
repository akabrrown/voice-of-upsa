import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ success: false, error: "Missing articleId" }, { status: 400 });
    }

    const supabase = await createClient();
    const cookieStore = await cookies();

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Manage/retrieve a visitor ID for anonymous tracking
    let visitorId = cookieStore.get("vou_visitor_id")?.value;
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      cookieStore.set("vou_visitor_id", visitorId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        sameSite: "lax",
      });
    }

    // 3. Attempt unique database insert
    const { error: insertError } = await supabase
      .from("article_views")
      .insert([
        {
          article_id: articleId,
          user_id: user?.id || null,
          visitor_id: visitorId,
        }
      ]);

    if (!insertError) {
      // Unique view recorded successfully! Increment via SECURITY DEFINER RPC to bypass RLS.
      const { error: rpcError } = await supabase.rpc("increment_article_view", {
        target_article_id: articleId,
      });

      if (rpcError) {
        // RPC doesn't exist yet — fall back to service-role direct update (best-effort)
        console.warn("increment_article_view RPC unavailable, trying direct update:", rpcError.message);
        const { data: art } = await supabase
          .from("articles")
          .select("view_count")
          .eq("id", articleId)
          .single();
        await supabase
          .from("articles")
          .update({ view_count: (art?.view_count || 0) + 1 })
          .eq("id", articleId);
      }

      return NextResponse.json({ success: true, message: "Unique view registered" });
    }

    // 4. Handle specific DB cases
    // Code 23505: Unique violation (already viewed by this user or visitor)
    if (insertError.code === "23505") {
      return NextResponse.json({ success: true, message: "Duplicate view ignored" });
    }

    // Code 42P01: Table does not exist (fallback to cookie-only tracking)
    if (insertError.code === "42P01") {
      let viewedCookie = cookieStore.get("vou_viewed_articles")?.value;
      let viewedArticles: string[] = [];
      if (viewedCookie) {
        try {
          viewedArticles = JSON.parse(viewedCookie);
        } catch (e) {
          viewedArticles = [];
        }
      }

      if (!viewedArticles.includes(articleId)) {
        // First time viewing in this browser
        const { data: art } = await supabase
          .from("articles")
          .select("view_count")
          .eq("id", articleId)
          .single();

        await supabase
          .from("articles")
          .update({ view_count: (art?.view_count || 0) + 1 })
          .eq("id", articleId);

        viewedArticles.push(articleId);
        if (viewedArticles.length > 50) {
          viewedArticles.shift(); // Limit cookie size
        }

        cookieStore.set("vou_viewed_articles", JSON.stringify(viewedArticles), {
          path: "/",
          maxAge: 60 * 60 * 24 * 365, // 1 year
          httpOnly: true,
          sameSite: "lax",
        });

        return NextResponse.json({ success: true, message: "Unique view registered (cookie fallback)" });
      }

      return NextResponse.json({ success: true, message: "Duplicate view ignored (cookie fallback)" });
    }

    // Other database errors
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });

  } catch (err: any) {
    console.error("Error inside view tracking API:", err);
    return NextResponse.json({ success: false, error: err.message || "Server Error" }, { status: 500 });
  }
}
