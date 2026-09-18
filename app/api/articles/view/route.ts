import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ success: false, error: "Missing articleId" }, { status: 400 });
    }

    const supabase = await createClient();
    const adminSupabase = getAdminClient();
    const cookieStore = await cookies();

    // 1. Get authenticated user (if any)
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

    // 3. Attempt unique database insert using admin client to bypass anonymous RLS blocks
    const { error: insertError } = await adminSupabase
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
      const { error: rpcError } = await adminSupabase.rpc("increment_article_view", {
        target_article_id: articleId,
      });

      if (rpcError) {
        // Fall back to direct increment
        const { data: art } = await adminSupabase
          .from("articles")
          .select("view_count")
          .eq("id", articleId)
          .single();
        await adminSupabase
          .from("articles")
          .update({ view_count: (art?.view_count || 0) + 1 })
          .eq("id", articleId);
      }

      return NextResponse.json({ success: true, message: "Unique view registered" });
    }

    // 4. Handle specific DB cases
    const isDuplicate = insertError.code === "23505" || insertError.message?.includes("duplicate");
    const isMissingTable = insertError.code === "42P01" || insertError.code === "PGRST205" || insertError.message?.includes("schema cache");

    if (isDuplicate) {
      return NextResponse.json({ success: true, message: "Duplicate view ignored" });
    }

    if (isMissingTable) {
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
        const { error: rpcError } = await adminSupabase.rpc("increment_article_view", {
          target_article_id: articleId,
        });

        if (rpcError) {
          const { data: art } = await adminSupabase
            .from("articles")
            .select("view_count")
            .eq("id", articleId)
            .single();

          await adminSupabase
            .from("articles")
            .update({ view_count: (art?.view_count || 0) + 1 })
            .eq("id", articleId);
        }

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

    // Other database errors - fall back gracefully
    console.warn("Non-fatal view insert issue:", insertError?.message);
    return NextResponse.json({ success: true, message: "View recorded (fallback)" });

  } catch (err: any) {
    console.warn("Non-fatal error inside view tracking API:", err);
    return NextResponse.json({ success: true, message: "View logged" });
  }
}
