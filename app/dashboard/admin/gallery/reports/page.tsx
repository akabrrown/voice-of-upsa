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
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch reports related to gallery photos
  const { data: reports, error } = await supabase
    .from("reports")
    .select(`
      *,
      reporter:profiles!reports_reporter_id_fkey(first_name, last_name, index_number)
    `)
    .eq("entity_type", "gallery_photo")
    .order("status", { ascending: true }) // pending first
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reports:", error);
  }

  // For each report, fetch the photo details. Since Supabase PostgREST might not easily join dynamic entity_ids without a direct relationship in some setups, we'll fetch them separately.
  // Wait, reports table might not have a direct foreign key to gallery_photos (it's polymorphic).
  // So we fetch the photos in a second query.
  
  let enrichedReports = reports || [];
  
  if (enrichedReports.length > 0) {
    const photoIds = enrichedReports.map((r: any) => r.entity_id);
    const { data: photos } = await supabase
      .from("gallery_photos")
      .select("id, image_url, album_id, album:gallery_albums!gallery_photos_album_id_fkey(title)")
      .in("id", photoIds);
      
    if (photos) {
      enrichedReports = enrichedReports.map((report: any) => {
        const photo = photos.find((p: any) => p.id === report.entity_id);
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Photo Reports</h1>
        <p className="text-gray-500 mt-1">Review flagged photos and take action on community reports.</p>
      </div>

      <GalleryReportsClient initialReports={enrichedReports} />
    </div>
  );
}
