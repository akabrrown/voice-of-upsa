import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/server-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, article_count:articles(count)")
    .order("name");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const body = await request.json();
  const adminSupabase = getAdminClient();
  const { data, error } = await adminSupabase
    .from("categories")
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
