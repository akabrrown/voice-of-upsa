import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendArticlePushNotification } from "@/lib/onesignal";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "10");
  const page = parseInt(searchParams.get("page") || "1");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("*, author:profiles!author_id(full_name, avatar_url), category:categories(name, slug)", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category_id", category);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  
  // Enforce workflow rules based on role
  if (profile.role === "editor") {
    body.status = (body.status === "draft" || body.status === "review") ? body.status : "review";
    delete body.published_at;
  }

  const { data, error } = await supabase
    .from("articles")
    .insert([{ ...body, author_id: user.id }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  if (data && data.status === "published") {
    // Non-blocking background push
    sendArticlePushNotification({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      cover_image_url: data.cover_image_url,
    }).catch((e) => console.error("OneSignal push error:", e));
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
