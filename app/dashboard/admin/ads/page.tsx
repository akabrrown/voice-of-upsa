import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdsManagerClient from "./AdsManagerClient";

export const metadata = {
  title: "Advertisements Management | Admin",
};

export default async function AdminAdsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: ads, error } = await supabase
    .from("advertisements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ads:", error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Advertisements Management</h1>
        <p className="text-gray-500 mt-2 font-medium">Review and manage submitted ad campaigns.</p>
      </div>

      <AdsManagerClient initialAds={ads || []} />
    </div>
  );
}
