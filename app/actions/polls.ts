"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Poll, PollCategory, PollOption, PollStatus, PollVisibility } from "@/lib/polls/types";

export type ActionState = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
};

// 1. Fetch Active Polls (for users/public)
export async function getActivePolls(category?: PollCategory) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("polls")
    .select(`
      *,
      options:poll_options(*),
      votes:poll_votes(option_id)
    `)
    .in("status", ["published", "closed"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching polls:", error);
    return { success: false, error: "Failed to fetch polls", data: [] };
  }

  // Map to PollWithDetails
  const formattedPolls = (data as any[]).map(poll => {
    // Total votes logic
    const total_votes = poll.options.reduce((sum: number, opt: any) => sum + opt.vote_count, 0);
    
    // Check if current user voted
    let user_voted_option_id = null;
    if (user) {
      // In a real scenario we'd do a specific query for user votes, but here we can check the votes array if RLS allows reading own votes
      const userVote = poll.votes?.find((v: any) => v.voter_id === user.id); // Although voter_id isn't returned by RLS sometimes, we can rely on RLS returning ONLY the user's vote.
      if (poll.votes && poll.votes.length > 0) {
        user_voted_option_id = poll.votes[0].option_id;
      }
    }

    return {
      ...poll,
      total_votes,
      user_voted_option_id
    };
  });

  return { success: true, data: formattedPolls };
}

// 2. Fetch Single Poll
export async function getPollBySlug(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: poll, error } = await supabase
    .from("polls")
    .select(`
      *,
      options:poll_options(*),
      votes:poll_votes(option_id)
    `)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (error || !poll) {
    return { success: false, error: "Poll not found" };
  }

  const total_votes = poll.options.reduce((sum: number, opt: any) => sum + opt.vote_count, 0);
  
  let user_voted_option_id = null;
  if (user && poll.votes && poll.votes.length > 0) {
    user_voted_option_id = poll.votes[0].option_id;
  }

  return { 
    success: true, 
    data: {
      ...poll,
      total_votes,
      user_voted_option_id
    } 
  };
}

// 3. Cast Vote
export async function castVote(pollId: string, optionId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to vote." };
  }

  // Verify poll is active
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("status, expires_at")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { success: false, error: "Poll not found." };
  }

  if (poll.status !== "published") {
    return { success: false, error: "This poll is not currently active." };
  }

  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return { success: false, error: "This poll has expired." };
  }

  // Check if already voted (enforced by DB, but good to check for UI message)
  const { count } = await supabase
    .from("poll_votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", pollId)
    .eq("voter_id", user.id);

  if (count && count > 0) {
    return { success: false, error: "You have already voted in this poll." };
  }

  // Insert vote
  const { error: voteError } = await supabase
    .from("poll_votes")
    .insert({
      poll_id: pollId,
      option_id: optionId,
      voter_id: user.id
    });

  if (voteError) {
    console.error("Error casting vote:", voteError);
    if (voteError.code === '23505') { // Unique violation
       return { success: false, error: "You have already voted in this poll." };
    }
    return { success: false, error: "Failed to cast vote. Please try again." };
  }

  revalidatePath("/polls");
  revalidatePath(`/polls/[slug]`, "page");
  
  return { success: true, message: "Vote cast successfully!" };
}

// ADMIN ACTIONS

export async function createPoll(formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const question = formData.get("question") as string;
  const category = formData.get("category") as PollCategory;
  const visibility = formData.get("results_visibility") as PollVisibility;
  const expires_at_str = formData.get("expires_at") as string;
  const status = formData.get("status") as PollStatus || "draft";
  
  const optionsRaw = formData.getAll("options[]") as string[];
  const options = optionsRaw.filter(o => o.trim() !== "");

  if (!question || options.length < 2) {
    return { success: false, error: "Question and at least 2 options are required." };
  }

  const slug = question.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) + "-" + Math.random().toString(36).substring(2, 7);
  const expires_at = expires_at_str ? new Date(expires_at_str).toISOString() : null;

  // 1. Insert Poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      question,
      slug,
      category,
      results_visibility: visibility,
      expires_at,
      status,
      created_by: user.id
    })
    .select()
    .single();

  if (pollError || !poll) {
    console.error(pollError);
    return { success: false, error: "Failed to create poll." };
  }

  // 2. Insert Options
  const optionsData = options.map((label, index) => ({
    poll_id: poll.id,
    label,
    sort_order: index
  }));

  const { error: optionsError } = await supabase
    .from("poll_options")
    .insert(optionsData);

  if (optionsError) {
    console.error(optionsError);
    // Ideally rollback poll creation here or soft-delete
    return { success: false, error: "Failed to create poll options." };
  }

  revalidatePath("/admin/polls");
  revalidatePath("/polls");
  return { success: true, message: "Poll created successfully." };
}

export async function deletePoll(pollId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  // Soft delete
  const { error } = await supabase
    .from("polls")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) {
    return { success: false, error: "Failed to delete poll." };
  }

  revalidatePath("/admin/polls");
  revalidatePath("/polls");
  return { success: true, message: "Poll deleted successfully." };
}

export async function updatePollStatus(pollId: string, status: PollStatus): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("polls")
    .update({ status })
    .eq("id", pollId);

  if (error) {
    return { success: false, error: "Failed to update poll status." };
  }

  revalidatePath("/admin/polls");
  revalidatePath("/polls");
  return { success: true, message: "Poll status updated." };
}
