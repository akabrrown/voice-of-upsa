import { Metadata } from "next";
import { getAlbumBySlug, getAlbumPhotos } from "@/app/actions/gallery";
import { notFound } from "next/navigation";
import { AlbumGalleryClient } from "./AlbumGalleryClient";
import { Calendar, ImageIcon, Camera } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getAlbumBySlug(params.slug);
  if (!result.data) return { title: "Album Not Found" };
  
  return {
    title: `${result.data.title} | Campus Gallery`,
    description: result.data.description || "View this photo album on Voice of UPSA.",
  };
}

export default async function AlbumPage({ params }: { params: { slug: string } }) {
  const [albumResult] = await Promise.all([
    getAlbumBySlug(params.slug)
  ]);

  if (!albumResult.data) {
    notFound();
  }

  const album = albumResult.data;
  const photosResult = await getAlbumPhotos(album.id);
  const photos = photosResult.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-10 border-b border-gray-200 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-upsa-navy text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {album.category.replace('_', ' ')}
            </span>
            {album.event_date && (
              <span className="flex items-center text-sm text-gray-500 font-medium">
                <Calendar className="w-4 h-4 mr-1.5" />
                {new Date(album.event_date).toLocaleDateString(undefined, { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#1B2A4A] mb-4 tracking-tight leading-tight">
            {album.title}
          </h1>
          {album.description && (
            <p className="text-lg text-gray-600 leading-relaxed">
              {album.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl flex items-center font-medium shadow-sm border border-gray-200/50">
            <ImageIcon className="w-5 h-5 mr-2 text-upsa-navy" />
            {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
          </div>
          {album.submissions_open && (
            <Button asChild className="bg-upsa-gold text-upsa-navy hover:bg-upsa-gold/90 font-bold px-6 shadow-sm">
              <Link href={`/gallery/${album.slug}/submit`}>
                <Camera className="w-4 h-4 mr-2" />
                Submit Photos
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Gallery Grid Client Component */}
      <AlbumGalleryClient photos={photos} albumId={album.id} submissionsOpen={album.submissions_open} />
    </div>
  );
}
