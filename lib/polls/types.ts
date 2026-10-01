export type PollCategory = "academics" | "campus_life" | "events" | "sports" | "opinion";
export type PollStatus = "draft" | "published" | "closed";
export type PollVisibility = "always" | "after_vote" | "after_close";

export interface Poll {
  id: string;
  slug: string;
  question: string;
  category: PollCategory;
  created_by: string | null;
  status: PollStatus;
  results_visibility: PollVisibility;
  expires_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  sort_order: number;
  vote_count: number;
  created_at: string;
  updated_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string;
  created_at: string;
}

export interface PollWithDetails extends Poll {
  options: PollOption[];
  total_votes: number;
  user_voted_option_id?: string | null; // For the current authenticated user
}
