import { Metadata } from "next";
import { getPublishedAlbums } from "@/app/actions/gallery";
import { GalleryAlbumCategory } from "@/lib/gallery/types";
import Link from "next/link";
import { ImageOff, Calendar, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Campus Gallery | Voice of UPSA",
  description: "View photo albums from events and campus life.",
};

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams.category as GalleryAlbumCategory | undefined;
  const result = await getPublishedAlbums(category);
  const albums = result.data || [];

  const categories = [
    { id: "events", label: "Events" },
    { id: "sports", label: "Sports" },
    { id: "academics", label: "Academics" },
    { id: "campus_life", label: "Campus Life" },
    { id: "clubs_societies", label: "Clubs & Societies" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1B2A4A] mb-2 tracking-tight">Campus Gallery</h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Explore photo albums curated by the editorial team and contributed by students.
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Button
          variant={!category ? "default" : "outline"}
          className={!category ? "bg-upsa-navy text-white hover:bg-upsa-navy/90" : "hover:text-upsa-navy"}
          asChild
        >
          <Link href="/gallery">All Albums</Link>
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={category === cat.id ? "default" : "outline"}
            className={category === cat.id ? "bg-upsa-navy text-white hover:bg-upsa-navy/90" : "hover:text-upsa-navy"}
            asChild
          >
            <Link href={`/gallery?category=${cat.id}`}>{cat.label}</Link>
          </Button>
        ))}
      </div>

      {/* Albums Grid */}
      {albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map((album) => (
            <Link href={`/gallery/${album.slug}`} key={album.id} className="group">
              <div className="bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {album.cover_photo?.image_url ? (
                    <Image
                      src={album.cover_photo.image_url}
                      alt={album.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <ImageOff className="w-12 h-12 mb-2 opacity-20" />
                      <span className="text-sm font-medium">No cover photo</span>
                    </div>
                  )}
                  {album.is_featured && (
                    <div className="absolute top-4 right-4 bg-upsa-gold text-upsa-navy text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      FEATURED
                    </div>
                  )}
                  {album.submissions_open && (
                    <div className="absolute top-4 left-4 bg-blue-600/90 text-white backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full shadow-md border border-white/20">
                      Open for Submissions
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {album.photos?.[0]?.count || 0}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-upsa-navy/80">
                    <span className="uppercase tracking-wider">{album.category.replace('_', ' ')}</span>
                    {album.event_date && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(album.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-upsa-navy transition-colors line-clamp-1 mb-2">
                    {album.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {album.description || "No description provided."}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No albums found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {category 
              ? `There are currently no published albums in the ${category.replace('_', ' ')} category.`
              : "Check back soon for new photos from campus events and activities."}
          </p>
        </div>
      )}
    </div>
  );
}
