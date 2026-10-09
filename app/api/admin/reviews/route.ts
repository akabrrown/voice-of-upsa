import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function verifyStaffRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return null;
  }
  return { user, role: profile.role };
}

export async function GET() {
  const auth = await verifyStaffRole();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // Fetch all reviews for admin
    const { data, error } = await supabase
      .from("site_reviews")
      .select(`
        id,
        rating,
        content,
        status,
        is_featured,
        created_at,
        profiles (
          full_name,
          department,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, reviews: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyStaffRole();
  if (!auth) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, is_featured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (is_featured !== undefined) updates.is_featured = is_featured;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, review: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
