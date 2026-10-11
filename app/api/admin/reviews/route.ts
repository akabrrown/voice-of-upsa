import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStaff();
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const supabase = getAdminClient();
    
    // Fetch all reviews for staff moderation
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
  const auth = await requireStaff();
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { id, status, is_featured } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Review ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ success: false, error: "Invalid status value" }, { status: 400 });
      }
      updates.status = status;
    }
    if (is_featured !== undefined) {
      updates.is_featured = Boolean(is_featured);
    }

    const supabase = getAdminClient();
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
