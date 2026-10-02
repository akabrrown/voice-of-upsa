import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { GalleryAlbumManageClient } from "./GalleryAlbumManageClient";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_albums")
    .select("title")
    .eq("id", params.id)
    .single();
    
  return {
    title: `Manage ${data?.title || "Album"} | Admin Dashboard`,
  };
}

export default async function AdminGalleryManagePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch album
  const { data: album, error: albumError } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("id", params.id)
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
