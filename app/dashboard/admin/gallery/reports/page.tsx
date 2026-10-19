import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GalleryReportsClient from "./GalleryReportsClient";

export const metadata: Metadata = {
  title: "Photo Reports | Admin Dashboard",
};

export default async function GalleryReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  // Fetch reports related to gallery photos
  const { data: reports, error } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(first_name, last_name, index_number)
    `)
    .eq("resource_type", "gallery_photo")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error);
  }

  let enrichedReports = reports || [];
  
  if (enrichedReports.length > 0) {
    const photoIds = enrichedReports.map((r: any) => r.resource_id);
    const { data: photos } = await supabase
      .from("gallery_photos")
      .select("id, image_url, album_id, album:gallery_albums!gallery_photos_album_id_fkey(title)")
      .in("id", photoIds);
      
    if (photos) {
      enrichedReports = enrichedReports.map((report: any) => {
        const photo = photos.find((p: any) => p.id === report.resource_id);
        return {
          ...report,
          photo: photo || null
        };
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Photo Reports</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Review flagged photos and take action on community reports.</p>
      </div>

      <GalleryReportsClient initialReports={enrichedReports} />
    </div>
  );
}
