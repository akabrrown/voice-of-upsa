"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PollCategory, PollStatus, PollVisibility } from "@/lib/polls/types";
import { sendBroadcastNotification } from "./notifications";

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
    console.error("Error fetching polls:", JSON.stringify(error));
    return { success: false, error: "Failed to fetch polls", data: [] };
  }

  const formattedPolls = (data as any[]).map(poll => {
    const total_votes = poll.options.reduce((sum: number, opt: any) => sum + opt.vote_count, 0);
    let user_voted_option_id = null;
    if (user && poll.votes && poll.votes.length > 0) {
      user_voted_option_id = poll.votes[0].option_id;
    }
    return { ...poll, total_votes, user_voted_option_id };
  });

  return { success: true, data: formattedPolls };
}

// 2. Fetch Single Poll by Slug
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
    data: { ...poll, total_votes, user_voted_option_id }
  };
}

// 3. Cast Vote
export async function castVote(pollId: string, optionId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be logged in to vote." };
  }

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

  const { count } = await supabase
    .from("poll_votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", pollId)
    .eq("voter_id", user.id);

  if (count && count > 0) {
    return { success: false, error: "You have already voted in this poll." };
  }

  const { error: voteError } = await supabase
    .from("poll_votes")
    .insert({ poll_id: pollId, option_id: optionId, voter_id: user.id });

  if (voteError) {
    console.error("Error casting vote:", JSON.stringify(voteError));
    if (voteError.code === "23505") {
      return { success: false, error: "You have already voted in this poll." };
    }
    return { success: false, error: "Failed to cast vote. Please try again." };
  }

  revalidatePath("/polls");
  revalidatePath(`/polls/[slug]`, "page");

  return { success: true, message: "Vote cast successfully!" };
}

// ADMIN: Create Poll
export async function createPoll(formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "editor") return { success: false, error: "Unauthorized" };

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

  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({ question, slug, category, results_visibility: visibility, expires_at, status, created_by: user.id })
    .select()
    .single();

  if (pollError || !poll) {
    console.error(JSON.stringify(pollError));
    return { success: false, error: "Failed to create poll." };
  }

  const optionsData = options.map((label, index) => ({
    poll_id: poll.id,
    label,
    sort_order: index
  }));

  const { error: optionsError } = await supabase.from("poll_options").insert(optionsData);

  if (optionsError) {
    console.error(JSON.stringify(optionsError));
    return { success: false, error: "Failed to create poll options." };
  }

  // Send notification if published immediately
  if (status === "published") {
    await sendBroadcastNotification("new_poll", "campus_life", {
      title: "New Campus Poll!",
      message: question,
      actionUrl: `/polls/${slug}`,
      pollId: poll.id
    });
  }

  revalidatePath("/dashboard/admin/polls");
  revalidatePath("/dashboard/editor/polls");
  revalidatePath("/polls");
  return { success: true, message: "Poll created successfully." };
}

// ADMIN: Soft-delete Poll
export async function deletePoll(pollId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "editor") return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("polls")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pollId);

  if (error) return { success: false, error: "Failed to delete poll." };

  revalidatePath("/dashboard/admin/polls");
  revalidatePath("/dashboard/editor/polls");
  revalidatePath("/polls");
  return { success: true, message: "Poll deleted successfully." };
}

// ADMIN: Update Poll Status
export async function updatePollStatus(pollId: string, status: PollStatus): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin" && profile?.role !== "editor") return { success: false, error: "Unauthorized" };

  // Fetch poll first to get details for notification
  const { data: poll } = await supabase.from("polls").select("*").eq("id", pollId).single();

  const { error } = await supabase
    .from("polls")
    .update({ status })
    .eq("id", pollId);

  if (error) return { success: false, error: "Failed to update poll status." };

  if (status === "published" && poll && poll.status !== "published") {
    await sendBroadcastNotification("new_poll", "campus_life", {
      title: "New Campus Poll!",
      message: poll.question,
      actionUrl: `/polls/${poll.slug}`,
      pollId: poll.id
    });
  }

  revalidatePath("/dashboard/admin/polls");
  revalidatePath("/dashboard/editor/polls");
  revalidatePath("/polls");
  return { success: true, message: "Poll status updated." };
}
