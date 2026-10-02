import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PlusCircle, Search, ImageIcon, Calendar, CheckSquare, Flag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryAlbum } from "@/lib/gallery/types";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Manage Gallery | Admin Dashboard",
};

export default async function AdminGalleryPage() {
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

  // Fetch albums, counting photos in each status
  const { data, error } = await supabase
    .from("gallery_albums")
    .select(`
      *,
      photos:gallery_photos!gallery_photos_album_id_fkey(status)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin albums:", error);
  }

  const albums = data || [];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Campus Gallery</h1>
          <p className="text-gray-500 mt-1">Manage photo albums, moderate student submissions, and curate events.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <Button asChild variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <Link href="/dashboard/admin/gallery/moderation">
              <CheckSquare className="w-4 h-4 mr-2" />
              Moderation Queue
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <Link href="/dashboard/admin/gallery/reports">
              <Flag className="w-4 h-4 mr-2" />
              Reports
            </Link>
          </Button>
          <Button asChild className="bg-upsa-navy hover:bg-upsa-navy/90 text-white">
            <Link href="/dashboard/admin/gallery/new">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Album
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-medium">Album Details</th>
                <th className="p-4 font-medium">Category / Date</th>
                <th className="p-4 font-medium">Photos</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {albums.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="font-medium text-gray-900 mb-1">No albums found</p>
                      <p className="text-sm">Create an album to start curating the gallery.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                albums.map((album) => {
                  const pendingCount = album.photos.filter((p: any) => p.status === 'pending_review').length;
                  const approvedCount = album.photos.filter((p: any) => p.status === 'approved').length;

                  return (
                    <tr key={album.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 line-clamp-1">{album.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {album.description || "No description"}
                            </p>
                            {album.is_featured && (
                              <span className="inline-block mt-1 text-[10px] bg-upsa-gold/20 text-upsa-navy px-1.5 py-0.5 rounded font-bold uppercase">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium uppercase tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
                            {album.category.replace('_', ' ')}
                          </span>
                          {album.event_date && (
                            <span className="text-xs text-gray-500 flex items-center mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(new Date(album.event_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <div className="text-center px-2 py-1 rounded bg-green-50 border border-green-100">
                            <div className="text-sm font-bold text-green-700">{approvedCount}</div>
                            <div className="text-[10px] uppercase text-green-600 font-semibold">Live</div>
                          </div>
                          {pendingCount > 0 && (
                            <div className="text-center px-2 py-1 rounded bg-yellow-50 border border-yellow-100 shadow-sm animate-pulse">
                              <div className="text-sm font-bold text-yellow-700">{pendingCount}</div>
                              <div className="text-[10px] uppercase text-yellow-600 font-semibold">Pending</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            album.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {album.status.toUpperCase()}
                          </span>
                          {album.submissions_open && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider border border-blue-200">
                              Submissions Open
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button asChild variant="outline" size="sm" className="font-semibold text-upsa-navy hover:text-upsa-navy hover:bg-gray-50 border-gray-200">
                          <Link href={`/dashboard/admin/gallery/${album.id}`}>
                            Manage
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
