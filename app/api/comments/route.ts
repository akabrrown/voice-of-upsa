import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";
import { commentSchema } from "@/lib/validations/index";
import {
  parseCommentContent,
  formatGuestCommentContent,
  generateGuestDiscriminator,
  isReservedName,
  getGuestAvatarColor,
} from "@/lib/comments/guest-identity";

const deleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  guest_id: z.string().min(10).optional(),
});

// In-memory anti-spam rate limit map (guest_id -> timestamp)
const guestRateLimitMap = new Map<string, number>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    return NextResponse.json({ success: false, error: "Article ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("article_id", articleId)
    .eq("is_approved", true)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  // Hydrate user profiles for registered users
  const userIds = Array.from(new Set(comments.map((c) => c.user_id).filter(Boolean)));
  let profileMap: Record<string, { full_name: string; avatar_url: string | null; role?: string }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", userIds);

    if (profiles && profiles.length > 0) {
      for (const p of profiles) {
        profileMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url, role: p.role };
      }
    }
  }

  const hydrated = comments.map((c) => {
    const parsed = parseCommentContent(c.content);

    // If written by a registered user with a valid profile
    if (c.user_id && profileMap[c.user_id]) {
      const p = profileMap[c.user_id];
      return {
        ...c,
        content: parsed.cleanContent || c.content,
        is_guest: false,
        guest_badge: null,
        guest_id: null,
        user: {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          role: p.role,
          is_guest: false,
        },
      };
    }

    // Guest comment or anonymous device author
    const effectiveGuestId = parsed.guestId || c.guest_id || null;
    const effectiveBadge =
      parsed.guestBadge || c.guest_badge || (effectiveGuestId ? generateGuestDiscriminator(effectiveGuestId) : "#0001");
    const colorObj = getGuestAvatarColor(effectiveGuestId || "");

    return {
      ...c,
      content: parsed.cleanContent,
      is_guest: true,
      guest_badge: effectiveBadge,
      guest_id: effectiveGuestId,
      user: {
        full_name: parsed.authorName || c.author_name || "Guest Reader",
        avatar_url: null,
        badge: effectiveBadge,
        avatar_color: colorObj.bg,
        border_color: colorObj.border,
        is_guest: true,
      },
    };
  });

  return NextResponse.json({ success: true, data: hydrated });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const rawBody = await request.json();
    const parsedBody = commentSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ success: false, error: firstIssue }, { status: 400 });
    }

    const { article_id, parent_id, content, author_name, guest_id } = parsedBody.data;
    const cleanContent = content.trim();

    const adminClient = getAdminClient();

    // Verify article existence and ensure comments are allowed
    const { data: targetArticle, error: articleErr } = await adminClient
      .from("articles")
      .select("id, title, slug, status, allow_comments, author_id")
      .eq("id", article_id)
      .maybeSingle();

    if (articleErr || !targetArticle) {
      return NextResponse.json(
        { success: false, error: "Article not found or unavailable." },
        { status: 404 }
      );
    }

    if (targetArticle.allow_comments === false) {
      return NextResponse.json(
        { success: false, error: "Comments have been disabled for this article." },
        { status: 403 }
      );
    }

    // Verify parent comment hierarchy (if replying)
    let parentCommentUserId: string | null = null;
    if (parent_id) {
      const { data: parentComment } = await adminClient
        .from("comments")
        .select("id, article_id, user_id")
        .eq("id", parent_id)
        .maybeSingle();

      if (!parentComment || parentComment.article_id !== article_id) {
        return NextResponse.json(
          { success: false, error: "Referenced parent comment was not found on this story." },
          { status: 400 }
        );
      }
      parentCommentUserId = parentComment.user_id;
    }

    // Anti-spam in-memory rate limiting (evict older than 1 minute)
    const now = Date.now();
    if (guestRateLimitMap.size > 2000) {
      for (const [key, timestamp] of guestRateLimitMap.entries()) {
        if (now - timestamp > 60000) {
          guestRateLimitMap.delete(key);
        }
      }
    }

    const rateLimitKey = user ? `usr_${user.id}` : `gst_${guest_id || "anon"}`;
    const lastCommentTime = guestRateLimitMap.get(rateLimitKey);
    if (lastCommentTime && now - lastCommentTime < 5000) {
      return NextResponse.json(
        { success: false, error: "You are commenting too quickly. Please wait a few seconds." },
        { status: 429 }
      );
    }
    guestRateLimitMap.set(rateLimitKey, now);

    // CASE 1: Authenticated Registered User
    if (user) {
      const { data, error } = await adminClient
        .from("comments")
        .insert([
          {
            article_id,
            parent_id: parent_id || null,
            content: cleanContent,
            user_id: user.id,
            is_approved: true,
            is_deleted: false,
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      // Dispatch author notifications asynchronously
      dispatchCommentNotifications({
        adminClient,
        targetArticle,
        commenterName: user.user_metadata?.full_name || "A reader",
        commentId: data.id,
        currentUserId: user.id,
        parentCommentUserId,
      });

      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    // CASE 2: Guest Commenter (Device Locked & Uniquely Identified)
    if (!author_name || !author_name.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide your display name to comment." },
        { status: 400 }
      );
    }

    const cleanAuthorName = author_name.trim().slice(0, 50);
    if (cleanAuthorName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (isReservedName(cleanAuthorName)) {
      return NextResponse.json(
        {
          success: false,
          error: "This name is reserved for official staff and editors. Please choose another name.",
        },
        { status: 400 }
      );
    }

    if (!guest_id || guest_id.length < 10) {
      return NextResponse.json(
        { success: false, error: "Device identifier is required for guest commenting." },
        { status: 400 }
      );
    }

    const badge = generateGuestDiscriminator(guest_id);
    const storedEnvelope = formatGuestCommentContent(cleanContent, {
      name: cleanAuthorName,
      guestId: guest_id,
      badge,
    });

    // Try inserting with dedicated guest columns first (when migration is applied)
    const primaryPayload = {
      article_id,
      parent_id: parent_id || null,
      content: storedEnvelope,
      user_id: null,
      is_approved: true,
      is_deleted: false,
      author_name: cleanAuthorName,
      guest_id: guest_id,
      guest_badge: badge,
      is_guest: true,
    };

    let result = await adminClient
      .from("comments")
      .insert([primaryPayload])
      .select()
      .single();

    // If database migration has not been applied yet, gracefully fall back to content envelope
    if (
      result.error &&
      (result.error.code === "42703" ||
        result.error.message?.includes("column") ||
        result.error.message?.includes("does not exist"))
    ) {
      result = await adminClient
        .from("comments")
        .insert([
          {
            article_id,
            parent_id: parent_id || null,
            content: storedEnvelope,
            user_id: null,
            is_approved: true,
            is_deleted: false,
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 });
    }

    // Dispatch author notifications asynchronously
    dispatchCommentNotifications({
      adminClient,
      targetArticle,
      commenterName: cleanAuthorName,
      commentId: result.data.id,
      currentUserId: null,
      parentCommentUserId,
    });

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (err: any) {
    console.error("Error in POST /api/comments:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Non-blocking notification helper for comment interactions
 */
async function dispatchCommentNotifications({
  adminClient,
  targetArticle,
  commenterName,
  commentId,
  currentUserId,
  parentCommentUserId,
}: {
  adminClient: any;
  targetArticle: { id: string; title: string; slug: string; author_id?: string | null };
  commenterName: string;
  commentId: string;
  currentUserId: string | null;
  parentCommentUserId: string | null;
}) {
  try {
    const notifs: any[] = [];

    // Notify article author
    if (targetArticle.author_id && targetArticle.author_id !== currentUserId) {
      notifs.push({
        recipient_id: targetArticle.author_id,
        type: "new_comment",
        category: "article",
        payload: {
          title: "New Discussion on Your Story",
          message: `${commenterName} commented on "${targetArticle.title}"`,
          article_id: targetArticle.id,
          comment_id: commentId,
          link: `/articles/${targetArticle.slug}#comment-${commentId}`,
        },
      });
    }

    // Notify parent comment author if reply
    if (
      parentCommentUserId &&
      parentCommentUserId !== currentUserId &&
      parentCommentUserId !== targetArticle.author_id
    ) {
      notifs.push({
        recipient_id: parentCommentUserId,
        type: "comment_reply",
        category: "article",
        payload: {
          title: "New Reply to Your Comment",
          message: `${commenterName} replied to your comment on "${targetArticle.title}"`,
          article_id: targetArticle.id,
          comment_id: commentId,
          link: `/articles/${targetArticle.slug}#comment-${commentId}`,
        },
      });
    }

    if (notifs.length > 0) {
      await adminClient.from("notifications").insert(notifs);
    }
  } catch (notifErr) {
    console.warn("Non-fatal notification dispatch error:", notifErr);
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const parsedBody = deleteCommentSchema.safeParse(body);

    if (!parsedBody.success) {
      const firstIssue = parsedBody.error.issues[0]?.message || "Invalid comment ID";
      return NextResponse.json(
        { success: false, error: firstIssue },
        { status: 400 }
      );
    }

    const { comment_id, guest_id } = parsedBody.data;

    const adminClient = getAdminClient();

    // Fetch the comment to verify ownership
    const { data: targetComment, error: fetchErr } = await adminClient
      .from("comments")
      .select("*")
      .eq("id", comment_id)
      .single();

    if (fetchErr || !targetComment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check staff permissions
    let isStaff = false;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isStaff = !!profile && ["admin", "editor"].includes(profile.role);
    }

    const isAuthorRegistered = user && targetComment.user_id === user.id;

    // Check guest ownership
    const parsed = parseCommentContent(targetComment.content);
    const isAuthorGuest =
      !targetComment.user_id &&
      guest_id &&
      (parsed.guestId === guest_id || targetComment.guest_id === guest_id);

    if (!isStaff && !isAuthorRegistered && !isAuthorGuest) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to delete this comment." },
        { status: 403 }
      );
    }

    const { error: deleteErr } = await adminClient
      .from("comments")
      .delete()
      .eq("id", comment_id);

    if (deleteErr) {
      return NextResponse.json(
        { success: false, error: deleteErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (err: any) {
    console.error("Error in DELETE /api/comments:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
