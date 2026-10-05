"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const postingSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    organization_name: z.string().trim().min(2).max(120),
    category_id: z.string().uuid(),
    type: z.enum(["full_time", "part_time", "internship", "volunteer", "freelance"]),
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
  | { ok: true }
  | { ok: false; error: string; field?: string };

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

  const { error } = await supabase
    .schema("jobs")
    .from("postings")
    .insert({
      ...parsed.data,
      image_url: parsed.data.image_url || null,
      slug: slugify(parsed.data.title),
      poster_id: user.id,
      status: isAdmin ? "approved" : "pending_review",
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    });

  if (error) {
    console.error("submitPosting failed", error.code, error.message);
    return { ok: false, error: `Database error: ${error.message}` };
  }
  return { ok: true };
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
