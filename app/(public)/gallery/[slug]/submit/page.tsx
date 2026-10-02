import { Metadata } from "next";
import { getAlbumBySlug } from "@/app/actions/gallery";
import { notFound, redirect } from "next/navigation";
import { GallerySubmitClient } from "./GallerySubmitClient";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getAlbumBySlug(params.slug);
  if (!result.data) return { title: "Not Found" };
  return { title: `Submit to ${result.data.title} | Campus Gallery` };
}

export default async function GallerySubmitPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/gallery/${params.slug}/submit`);
  }

  const result = await getAlbumBySlug(params.slug);
  if (!result.data) notFound();

  const album = result.data;

  if (!album.submissions_open) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Submissions Closed</h1>
        <p className="text-gray-600 mb-8">This album is no longer accepting student photo submissions.</p>
        <a href={`/gallery/${album.slug}`} className="text-upsa-navy font-semibold hover:underline">
          &larr; Back to Album
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-[#1B2A4A] mb-4 tracking-tight">
          Submit to {album.title}
        </h1>
        <p className="text-gray-600 text-lg">
          Share your best shots from this event with the campus community.
        </p>
      </div>

      <GallerySubmitClient albumId={album.id} albumSlug={album.slug} />
    </div>
  );
}
