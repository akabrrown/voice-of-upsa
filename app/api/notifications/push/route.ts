import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendPushToTopic } from "@/lib/push/send";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only admin and editor can trigger broadcast pushes
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "editor"].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only editors and admins can trigger push notifications." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const article = body.article;

    if (!article || !article.title || !article.slug) {
      return NextResponse.json(
        { success: false, error: "Invalid payload: Article title and slug are required." },
        { status: 400 }
      );
    }

    // Send broadcast push to the "new_articles" topic via Native Web Push
    await sendPushToTopic("new_articles", {
      title: article.title,
      body: article.excerpt || "Read the latest article on Voice of UPSA",
      imageUrl: article.cover_image_url || "https://www.voiceofupsa.com/icon-512.png",
      url: `/articles/${article.slug}`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Push API route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
