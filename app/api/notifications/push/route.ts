import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getAdminMessaging } from "@/lib/firebase-admin";

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

    // Send broadcast push to the "all_users" topic via Firebase
    const message = {
      notification: {
        title: article.title,
        body: article.excerpt || "Read the latest article on Voice of UPSA",
        // Fallback image if featured_image is missing
        imageUrl: article.featured_image || "https://voiceofupsa.com/icon.png", 
      },
      data: {
        url: `https://voiceofupsa.com/articles/${article.slug}`,
      },
      topic: "all_users",
    };

    const messaging = getAdminMessaging();
    const response = await messaging.send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("Push API route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
