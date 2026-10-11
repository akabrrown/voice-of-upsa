import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth/user";
import { logAudit } from "@/lib/audit/logger";

export async function GET(req: Request) {
  try {
    const user = await getUser();
    const isAdmin = Boolean(user && (user.is_admin === true || user.role === 'admin' || user.role === 'developer'));
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status") || "pending_review";
    
    let data, error;

    if (statusParam === "removed" || statusParam === "rejected") {
      const res = await supabase
        .from('confession_posts')
        .select('id, type, category, body_text, created_at, status, screening_flag, review_note, reviewed_at')
        .in('status', ['removed', 'rejected'])
        .order('created_at', { ascending: false });
      data = res.data;
      error = res.error;
    } else if (statusParam !== "all") {
      const res = await supabase
        .from('confession_posts')
        .select('id, type, category, body_text, created_at, status, screening_flag, review_note, reviewed_at')
        .eq('status', statusParam)
        .order('created_at', { ascending: false });
      data = res.data;
      error = res.error;
    } else {
      const res = await supabase
        .from('confession_posts')
        .select('id, type, category, body_text, created_at, status, screening_flag, review_note, reviewed_at')
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
    const isAdmin = Boolean(user && (user.is_admin === true || user.role === 'admin' || user.role === 'developer'));
    if (!isAdmin || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { post_id, action, review_note } = body;

    if (!post_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const note = review_note?.trim() || "";
    if (action === 'reject' && !note) {
      return NextResponse.json({ success: false, error: "A rejection reason is required" }, { status: 400 });
    }

    const supabase = getAdminClient();
    
    // Check if post exists
    const { data: post, error: fetchError } = await supabase
      .from('confession_posts')
      .select('id, status, author_id')
      .eq('id', post_id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const newStatus = action === 'approve' 
      ? 'published' 
      : (post.status === 'published' ? 'removed' : 'rejected');

    // Update post status and persist rejection note
    const { error: updateError } = await supabase
      .from('confession_posts')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_note: action === 'reject' ? note : null,
        published_at: action === 'approve' ? new Date().toISOString() : null,
      })
      .eq('id', post_id);

    if (updateError) throw updateError;

    // Log the audit (records the review_note)
    await logAudit(
      user.id,
      action === 'approve' ? 'confession_approved' : 'confession_rejected',
      'confession_posts',
      post_id,
      { previous_status: post.status, new_status: newStatus, review_note: note }
    );

    // Insert notification directly to submitter if author_id exists
    if (post.author_id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        type: action === 'approve' ? 'confession_approved' : 'confession_rejected',
        title: action === 'approve' ? 'Your confession was approved' : 'Your confession was not approved',
        message: action === 'approve' 
          ? 'Your anonymous post is now live on the campus confessions feed.' 
          : `Your submission was rejected by moderators. Reason: ${note}`,
        link: action === 'approve' ? '/confessions' : '/confessions/mine',
        is_read: false
      });
    }

    return NextResponse.json({ success: true, message: `Post ${action}d successfully` });
  } catch (error: any) {
    console.error("Error updating confession:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
