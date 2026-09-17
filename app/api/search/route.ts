import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get("q");

  if (!rawQ || typeof rawQ !== "string") {
    return NextResponse.json({ success: true, data: [] });
  }

  // Strip PostgREST delimiters and control characters to prevent filter tree injection
  const cleanQ = rawQ.replace(/[,()%.*"'`\\]/g, " ").trim().slice(0, 100);

  if (!cleanQ) {
    return NextResponse.json({ success: true, data: [] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, author:profiles!author_id(full_name), category:categories(name)")
    .eq("status", "published")
    .or(`title.ilike.%${cleanQ}%,content.ilike.%${cleanQ}%,excerpt.ilike.%${cleanQ}%`)
    .limit(20);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
