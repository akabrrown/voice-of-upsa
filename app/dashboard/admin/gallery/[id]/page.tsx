import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GalleryAlbumManageClient } from "./GalleryAlbumManageClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select("title")
    .eq("id", id)
    .single();
    
  return {
    title: `Manage ${data?.title || "Album"} | Admin Dashboard`,
  };
}

export default async function AdminGalleryManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard/admin/gallery/" + id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isStaff = ['admin', 'editor', 'developer'].includes(profile?.role) || profile?.is_admin === true;
  if (!isStaff) {
    redirect("/dashboard");
  }

  // Fetch album
  const { data: album, error: albumError } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (albumError || !album) {
    notFound();
  }

  // Fetch photos
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select(`
      *,
      profiles(full_name, avatar_url)
    `)
    .eq("album_id", album.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto">
      <GalleryAlbumManageClient initialAlbum={album} initialPhotos={photos || []} />
    </div>
  );
}
