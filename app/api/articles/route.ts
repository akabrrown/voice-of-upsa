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
    .select("*, author:profiles!author_id(full_name, avatar_url), publisher:profiles!publisher_id(full_name), category:categories(name, slug)", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (category) {
    query = query.eq("category_id", category);
  }

  let { data, count, error } = await query;

  // Fallback for pre-migration schema: fetch without publisher join
  if (error && (error.code === "PGRST200" || error.message?.includes("publisher_id"))) {
    let fallbackQuery = supabase
      .from("articles")
      .select("*, author:profiles!author_id(full_name, avatar_url), category:categories(name, slug)", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);

    if (category) {
      fallbackQuery = fallbackQuery.eq("category_id", category);
    }

    const fallbackResult = await fallbackQuery;
    data = fallbackResult.data;
    count = fallbackResult.count;
    error = fallbackResult.error;
  }

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

  const { author_id, author_name, author_title, ...articleFields } = body;
  const resolvedAuthorId = author_id || (author_name ? null : user.id);
  const insertPayload = {
    ...articleFields,
    author_id: resolvedAuthorId,
    author_name: author_name || null,
    author_title: author_title || null,
    publisher_id: body.status === "published" ? user.id : null,
  };

  let { data, error } = await supabase
    .from("articles")
    .insert([insertPayload])
    .select()
    .single();

  // Gracefully retry with core fields if new columns are not yet present in the database
  if (error && (error.message?.includes("publisher_id") || error.message?.includes("author_name") || error.message?.includes("author_title") || (error as any).code === "42703")) {
    const fallbackPayload = { ...insertPayload };
    delete (fallbackPayload as any).publisher_id;
    delete (fallbackPayload as any).author_name;
    delete (fallbackPayload as any).author_title;
    const retry = await supabase.from("articles").insert([fallbackPayload]).select().single();
    data = retry.data;
    error = retry.error;
  }

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
