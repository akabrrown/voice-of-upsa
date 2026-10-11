import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to react to posts." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { reaction_type } = body;

    const validReactions = ["relate", "support", "funny"];
    if (!validReactions.includes(reaction_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid reaction type." },
        { status: 400 }
      );
    }

    // Check existing reaction
    const { data: existingReaction, error: fetchError } = await supabase
      .from("confession_reactions")
      .select("id, reaction_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching reaction:", fetchError);
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    let userReaction: string | null = null;

    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // Toggle off
        const { error: deleteError } = await supabase
          .from("confession_reactions")
          .delete()
          .eq("id", existingReaction.id);

        if (deleteError) throw deleteError;
        userReaction = null;
      } else {
        // Update to new reaction
        const { error: updateError } = await supabase
          .from("confession_reactions")
          .update({ reaction_type })
          .eq("id", existingReaction.id);

        if (updateError) throw updateError;
        userReaction = reaction_type;
      }
    } else {
      // Insert new reaction
      const { error: insertError } = await supabase
        .from("confession_reactions")
        .insert({
          post_id: postId,
          user_id: user.id,
          reaction_type,
        });

      if (insertError) throw insertError;
      userReaction = reaction_type;
    }

    // Fetch refreshed reactions for this post
    const { data: refreshedReactions } = await supabase
      .from("confession_reactions")
      .select("reaction_type, user_id")
      .eq("post_id", postId);

    return NextResponse.json({
      success: true,
      userReaction,
      reactions: refreshedReactions || [],
    });
  } catch (err: any) {
    console.error("Error toggling confession reaction:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process reaction." },
      { status: 500 }
    );
  }
}
