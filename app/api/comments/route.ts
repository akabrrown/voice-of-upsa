import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    return NextResponse.json({ success: false, error: "Article ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, user:profiles(full_name, avatar_url)")
    .eq("article_id", articleId)
    .eq("is_approved", true)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { article_id, content } = body;

  if (!article_id || typeof article_id !== "string") {
    return NextResponse.json({ success: false, error: "Valid article ID is required" }, { status: 400 });
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ success: false, error: "Comment content cannot be empty" }, { status: 400 });
  }

  const cleanContent = content.trim().slice(0, 2000);

  // Check if user is an editor or admin to optionally auto-approve
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isStaff = profile && ["admin", "editor"].includes(profile.role);

  // Whitelisted database payload preventing mass assignment of is_approved or unauthorized columns
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        article_id,
        content: cleanContent,
        user_id: user.id,
        is_approved: isStaff ? true : false,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
