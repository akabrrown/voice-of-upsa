"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const postingSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    organization_name: z.string().trim().min(2).max(120),
    organization_website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    category_id: z.string().uuid(),
    type: z.enum(["full_time", "part_time", "internship", "volunteer", "freelance"]),
    experience_level: z.enum(["entry", "mid", "senior", "not_applicable"]).optional().default("not_applicable"),
    location_type: z.enum(["on_campus", "accra", "remote", "other"]),
    location_label: z.string().trim().max(120).optional().default(""),
    description: z.string().trim().min(30).max(5000),
    requirements: z.string().trim().min(10).max(3000),
    compensation_type: z.enum(["paid", "unpaid", "stipend", "undisclosed"]),
    compensation_details: z.string().trim().max(120).optional().default(""),
    apply_method: z.enum(["link", "email", "instructions"]),
    apply_value: z.string().trim().min(3).max(500),
    image_url: z
      .string()
      .trim()
      .max(500)
      .regex(/^https:\/\/res\.cloudinary\.com\//, "Invalid image.")
      .optional()
      .or(z.literal("")),
    expires_at: z.string().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.apply_method === "link" && !/^https?:\/\/[^\s]+$/i.test(value.apply_value)) {
      ctx.addIssue({ code: "custom", path: ["apply_value"], message: "Enter a valid http(s) link." });
    }
    if (value.apply_method === "email" && !z.string().email().safeParse(value.apply_value).success) {
      ctx.addIssue({ code: "custom", path: ["apply_value"], message: "Enter a valid email address." });
    }
  });

export type PostingInput = z.input<typeof postingSchema>;

export type SubmitResult =
  | { ok: true; pendingReview?: boolean }
  | { ok: false; error: string; field?: string };

// Must match max_window in jobs.guard_posting_write().
export const MAX_CLOSING_DAYS = 90;
const DAY_MS = 86_400_000;

// Error codes raised deliberately by jobs.guard_posting_write(); their
// messages are written for end users. Anything else stays server-side.
const GUARD_ERROR_CODES = new Set(["P0001", "22023", "42501"]);

function toClosingTimestamp(dateInput: string): Date | null {
  const parsed = new Date(dateInput);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function closingDateError(closesAt: Date): string | null {
  const now = Date.now();
  if (closesAt.getTime() <= now) return "Pick a closing date after today.";
  if (closesAt.getTime() > now + MAX_CLOSING_DAYS * DAY_MS) {
    return `Closing date must be within ${MAX_CLOSING_DAYS} days.`;
  }
  return null;
}

function toUserError(action: string, error: { code?: string; message: string }): SubmitResult {
  console.error(`${action} failed`, error.code, error.message);
  if (error.code && GUARD_ERROR_CODES.has(error.code)) {
    return { ok: false, error: error.message };
  }
  return { ok: false, error: "Could not save this posting. Try again in a moment." };
}

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "posting"}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function submitPosting(input: PostingInput): Promise<SubmitResult> {
  const parsed = postingSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to post an opportunity." };

  const { count } = await supabase
    .schema("jobs")
    .from("postings")
    .select("id", { count: "exact", head: true })
    .eq("poster_id", user.id)
    .gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  
  if ((count ?? 0) >= 5) {
    return { ok: false, error: "Daily posting limit reached. Try again tomorrow." };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const closesAt = parsed.data.expires_at ? toClosingTimestamp(parsed.data.expires_at) : null;
  if (parsed.data.expires_at && !closesAt) {
    return { ok: false, error: "Enter a valid closing date.", field: "expires_at" };
  }
  if (closesAt && !isAdmin) {
    const dateError = closingDateError(closesAt);
    if (dateError) return { ok: false, error: dateError, field: "expires_at" };
  }

  // The database forces pending_review for non-admins regardless of this value.
  const { error } = await supabase
    .schema("jobs")
    .from("postings")
    .insert({
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      slug: slugify(parsed.data.title),
      poster_id: user.id,
      status: isAdmin ? "approved" : "pending_review",
      expires_at: closesAt ? closesAt.toISOString() : null,
    });

  if (error) return toUserError("submitPosting", error);
  return { ok: true, pendingReview: !isAdmin };
}

export async function editPosting(postingId: string, input: PostingInput): Promise<SubmitResult> {
  if (!z.string().uuid().safeParse(postingId).success) {
    return { ok: false, error: "Invalid posting." };
  }
  const parsed = postingSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to edit this opportunity." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  const { data: existing } = await supabase
    .schema("jobs")
    .from("postings")
    .select("poster_id, expires_at")
    .eq("id", postingId)
    .single();

  if (!existing || (!isAdmin && existing.poster_id !== user.id)) {
    return { ok: false, error: "You don't have permission to edit this posting." };
  }

  // The form round-trips the date as YYYY-MM-DD; only treat it as a change
  // when the calendar date actually differs, so an untouched date isn't
  // re-validated against the window on every save.
  const { expires_at: submittedDate, ...content } = parsed.data;
  const existingDate = existing.expires_at
    ? new Date(existing.expires_at).toISOString().split("T")[0]
    : "";
  const update: Record<string, unknown> = {
    ...content,
    image_url: content.image_url || null,
  };

  if ((submittedDate ?? "") !== existingDate) {
    if (!submittedDate) {
      if (!isAdmin) {
        return { ok: false, error: "A closing date can be moved but not removed.", field: "expires_at" };
      }
      update.expires_at = null;
    } else {
      const closesAt = toClosingTimestamp(submittedDate);
      if (!closesAt) return { ok: false, error: "Enter a valid closing date.", field: "expires_at" };
      if (!isAdmin) {
        const dateError = closingDateError(closesAt);
        if (dateError) return { ok: false, error: dateError, field: "expires_at" };
      }
      update.expires_at = closesAt.toISOString();
    }
  }

  // Status is never sent: jobs.guard_posting_write() moves the posting back
  // to pending_review only when reviewable content changed.
  const { data: saved, error } = await supabase
    .schema("jobs")
    .from("postings")
    .update(update)
    .eq("id", postingId)
    .select("status")
    .single();

  if (error) return toUserError("editPosting", error);
  return { ok: true, pendingReview: saved?.status === "pending_review" };
}

export async function closePosting(postingId: string): Promise<SubmitResult> {
  if (!z.string().uuid().safeParse(postingId).success) {
    return { ok: false, error: "Invalid posting." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { data, error } = await supabase
    .schema("jobs")
    .from("postings")
    .update({ status: "closed" })
    .eq("id", postingId)
    .eq("poster_id", user.id)
    .select("id");

  if (error || !data?.length) return { ok: false, error: "Could not close this posting." };
  return { ok: true };
}
