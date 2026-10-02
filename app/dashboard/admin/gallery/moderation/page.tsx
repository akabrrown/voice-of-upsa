import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GalleryModerationClient from "./GalleryModerationClient";

export const metadata: Metadata = {
  title: "Photo Moderation Queue | Admin Dashboard",
};

export default async function GalleryModerationPage() {
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

  // Fetch pending photos with their associated album and submitter profile
  const { data: pendingPhotos, error } = await supabase
    .from("gallery_photos")
    .select(`
      *,
      album:gallery_albums!gallery_photos_album_id_fkey(title),
      submitter:profiles!gallery_photos_submitted_by_fkey(first_name, last_name, index_number)
    `)
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching pending photos:", error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Photo Moderation</h1>
        <p className="text-gray-500 mt-1">Review and approve photo submissions from students.</p>
      </div>

      <GalleryModerationClient initialPhotos={pendingPhotos || []} />
    </div>
  );
}
