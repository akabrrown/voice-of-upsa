import { createClient } from "./client";

// Articles
export async function getArticles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, profiles(full_name, avatar_url), categories(name)")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getArticleBySlug(slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, profiles(full_name, avatar_url, bio), categories(name)")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

// Categories
export async function getCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*");

  if (error) throw error;
  return data;
}

// Advertisements
export async function getActiveAds(type?: string) {
  const supabase = createClient();
  let query = supabase
    .from("advertisements")
    .select("*")
    .eq("status", "active");

  if (type) {
    query = query.eq("ad_type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// User Profiles
export async function getProfile(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
