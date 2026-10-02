"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { GalleryAlbumCategory, GalleryAlbumStatus, GalleryPhotoSource, GalleryPhotoStatus, AlbumWithCover, PhotoWithAuthor } from "@/lib/gallery/types";

export type ActionState = {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
};

// -- ALBUMS (Admin) --

export async function createAlbum(formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as GalleryAlbumCategory;
  const event_date = formData.get("event_date") as string || null;
  const status = formData.get("status") as GalleryAlbumStatus || "draft";
  const submissions_open = formData.get("submissions_open") === "true";
  const is_featured = formData.get("is_featured") === "true";

  if (!title) return { success: false, error: "Title is required" };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50) + "-" + Math.random().toString(36).substring(2, 7);

  const { data: album, error } = await supabase
    .from("gallery_albums")
    .insert({
      title,
      slug,
      description,
      category,
      event_date,
      status,
      submissions_open,
      is_featured,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating album:", error);
    return { success: false, error: "Failed to create album" };
  }

  revalidatePath("/dashboard/admin/gallery");
  revalidatePath("/gallery");
  return { success: true, message: "Album created successfully", data: album };
}

export async function updateAlbum(id: string, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const category = formData.get("category") as GalleryAlbumCategory;
  const event_date = formData.get("event_date") as string || null;
  const status = formData.get("status") as GalleryAlbumStatus;
  const submissions_open = formData.get("submissions_open") === "true";
  const is_featured = formData.get("is_featured") === "true";
  
  if (!title) return { success: false, error: "Title is required" };

  const { error } = await supabase
    .from("gallery_albums")
    .update({
      title,
      description,
      category,
      event_date,
      status,
      submissions_open,
      is_featured
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating album:", error);
    return { success: false, error: "Failed to update album" };
  }

  revalidatePath("/dashboard/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath(`/gallery/${id}`); // Assuming we don't have slug readily available
  return { success: true, message: "Album updated successfully" };
}

export async function setAlbumCover(albumId: string, photoId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("gallery_albums")
    .update({ cover_photo_id: photoId })
    .eq("id", albumId);

  if (error) return { success: false, error: "Failed to set cover photo" };
  
  revalidatePath(`/dashboard/admin/gallery/${albumId}`);
  revalidatePath("/gallery");
  return { success: true };
}

// -- PUBLIC READS --

export async function getPublishedAlbums(category?: GalleryAlbumCategory) {
  const supabase = await createClient();
  let query = supabase
    .from("gallery_albums")
    .select(`
      *,
      cover_photo:gallery_photos!gallery_albums_cover_photo_id_fkey(image_url),
      photos:gallery_photos!gallery_photos_album_id_fkey(count)
    `)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching albums:", error);
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data as unknown as AlbumWithCover[] };
}

export async function getAlbumBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(`*`)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();

  if (error) return { success: false, error: error.message, data: null };
  return { success: true, data };
}

export async function getAlbumPhotos(albumId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gallery_photos")
    .select(`
      *,
      profiles(full_name, avatar_url)
    `)
    .eq("album_id", albumId)
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data as unknown as PhotoWithAuthor[] };
}

// -- PHOTOS (Admin & User) --

export async function submitPhoto(formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const album_id = formData.get("album_id") as string;
  const image_url = formData.get("image_url") as string;
  const caption = formData.get("caption") as string | null;
  const consent_confirmed = formData.get("consent_confirmed") === "true";

  if (!album_id || !image_url) return { success: false, error: "Missing required fields" };
  if (!consent_confirmed) return { success: false, error: "You must confirm consent to submit a photo" };

  // Check if admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = profile?.role === "admin";

  const source: GalleryPhotoSource = isAdmin ? "admin" : "submission";
  const status: GalleryPhotoStatus = isAdmin ? "approved" : "pending_review";

  const { error } = await supabase
    .from("gallery_photos")
    .insert({
      album_id,
      image_url,
      caption,
      source,
      status,
      submitted_by: user.id,
      consent_confirmed
    });

  if (error) {
    console.error("Error submitting photo:", error);
    return { success: false, error: "Failed to upload photo" };
  }

  revalidatePath(`/gallery/[slug]`, "page");
  if (isAdmin) revalidatePath(`/dashboard/admin/gallery/${album_id}`);
  
  return { 
    success: true, 
    message: isAdmin ? "Photo uploaded successfully" : "Photo submitted and pending review" 
  };
}

export async function moderatePhoto(photoId: string, status: GalleryPhotoStatus): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("gallery_photos")
    .update({ status })
    .eq("id", photoId);

  if (error) return { success: false, error: "Failed to moderate photo" };

  revalidatePath("/dashboard/admin/gallery");
  return { success: true, message: `Photo marked as ${status}` };
}

export async function resolveReport(reportId: string, action: "dismiss" | "delete_photo", photoId?: string): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // First, verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { success: false, error: "Unauthorized access" };
  }

  if (action === "delete_photo" && photoId) {
    // Delete the photo itself
    const { error: deleteError } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", photoId);
      
    if (deleteError) return { success: false, error: "Failed to delete photo" };
  }

  // Update report status
  const { error: reportError } = await supabase
    .from("reports")
    .update({ 
      status: "resolved", 
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      resolution_notes: action === "delete_photo" ? "Photo deleted" : "Report dismissed"
    })
    .eq("id", reportId);

  if (reportError) return { success: false, error: "Failed to update report status" };

  revalidatePath("/dashboard/admin/gallery/reports");
  return { success: true, message: `Report successfully resolved` };
}
