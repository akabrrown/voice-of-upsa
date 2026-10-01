import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/upstash";
import type { StudentService, ServiceCategory } from "@/lib/types/services";

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const cacheKey = "directory:categories";
  
  try {
    const cached = await redis.get<ServiceCategory[]>(cacheKey);
    if (cached) return cached;
  } catch (error) {
    console.error("Redis fetch error (categories):", error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    console.error("Supabase fetch error (categories):", error);
    return [];
  }

  try {
    await redis.set(cacheKey, data, { ex: 86400 }); // Cache for 24 hours
  } catch (error) {
    console.error("Redis set error (categories):", error);
  }

  return data as ServiceCategory[];
}

export async function getActiveServices(): Promise<StudentService[]> {
  const cacheKey = "directory:services:active";
  
  try {
    const cached = await redis.get<StudentService[]>(cacheKey);
    if (cached) return cached;
  } catch (error) {
    console.error("Redis fetch error (services):", error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_services")
    .select(`
      *,
      category:category_id (*)
    `)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("name");

  if (error) {
    console.error("Supabase fetch error (services):", error);
    return [];
  }

  try {
    await redis.set(cacheKey, data, { ex: 86400 });
  } catch (error) {
    console.error("Redis set error (services):", error);
  }

  return data as StudentService[];
}

export async function getServiceBySlug(slug: string): Promise<StudentService | null> {
  const cacheKey = `directory:service:${slug}`;
  
  try {
    const cached = await redis.get<StudentService>(cacheKey);
    if (cached) return cached;
  } catch (error) {
    console.error(`Redis fetch error (service ${slug}):`, error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("directory_services")
    .select(`
      *,
      category:category_id (*)
    `)
    .eq("slug", slug)
    .eq("status", "active")
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error(`Supabase fetch error (service ${slug}):`, error);
    return null;
  }

  try {
    await redis.set(cacheKey, data, { ex: 86400 });
  } catch (error) {
    console.error(`Redis set error (service ${slug}):`, error);
  }

  return data as StudentService;
}

export async function getAllServicesForAdmin(): Promise<StudentService[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('directory_services')
    .select('*, category:category_id (*)')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    console.error('Supabase fetch error (admin services):', error);
    return [];
  }

  return data as StudentService[];
}

export async function getAllCategoriesForAdmin(): Promise<ServiceCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('directory_categories')
    .select('*')
    .order('sort_order');

  if (error) {
    console.error('Supabase fetch error (admin categories):', error);
    return [];
  }

  return data as ServiceCategory[];
}

