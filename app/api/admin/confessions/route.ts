import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/user";
import { logAudit } from "@/lib/audit/logger";

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user || !user.is_admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") || "pending_review";
    
    let data, error;

    if (statusParam !== "all") {
      const res = await supabase
        .from('confession_posts')
        .select('id, type, category, body_text, created_at, status, screening_flag')
        .eq('status', statusParam)
        .order('created_at', { ascending: false });
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from('confession_posts')
        .select('id, type, category, body_text, created_at, status, screening_flag')
        .order('created_at', { ascending: false });
      data = res.data;
      error = res.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching pending confessions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getUser();
    if (!user || !user.is_admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { post_id, action, review_note } = body;

    if (!post_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    if (action === 'reject' && (!review_note || review_note.trim() === '')) {
      return NextResponse.json({ success: false, error: "Rejection requires a review note" }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'published' : 'removed';

    const supabase = await createClient();
    
    // Check if post exists and is pending
    const { data: post, error: fetchError } = await supabase
      .from('confession_posts')
      .select('id, status, author_id')
      .eq('id', post_id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Update post status
    const { error: updateError } = await supabase
      .from('confession_posts')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', post_id);

    if (updateError) throw updateError;

    // Log the audit (this records the review_note)
    await logAudit(
      user.id,
      action === 'approve' ? 'confession_approved' : 'confession_rejected',
      'confession_posts',
      post_id,
      { previous_status: post.status, new_status: newStatus, review_note }
    );

    // Insert notification directly
    await supabase.from('notifications').insert({
      user_id: post.author_id,
      type: action === 'approve' ? 'confession_approved' : 'confession_rejected',
      title: action === 'approve' ? 'Your post was approved' : 'Your post was rejected',
      message: action === 'approve' 
        ? 'Your anonymous post is now live on the feed.' 
        : `Your post was rejected for violating our guidelines. Note: ${review_note}`,
      link: action === 'approve' ? '/confessions/mine' : null,
      is_read: false
    });

    return NextResponse.json({ success: true, message: `Post ${action}d successfully` });
  } catch (error: any) {
    console.error("Error updating confession:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
