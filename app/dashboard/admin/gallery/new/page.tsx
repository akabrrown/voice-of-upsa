import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryAlbumCreateClient } from "./GalleryAlbumCreateClient";

export const metadata: Metadata = {
  title: "Create Album | Admin Dashboard",
};

export default async function CreateAlbumPage() {
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create New Album</h1>
        <p className="text-gray-500 mt-1">Set up a new photo gallery album for the community.</p>
      </div>

      <GalleryAlbumCreateClient />
    </div>
  );
}
