import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MyPostingsList, { type MyPosting } from "./MyPostingsList";

export const metadata = {
  title: "My Postings | Voice of UPSA",
  description: "Track the status of the opportunities you have posted.",
};

export default async function MyPostingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/jobs/mine");

  const { data, error } = await supabase
    .schema("jobs")
    .from("postings")
    .select("id, slug, title, organization_name, type, status, expires_at, created_at")
    .eq("poster_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1B2A4A] tracking-tight">My Postings</h1>
            <p className="text-gray-500 mt-1">Pending postings go live once an admin approves them.</p>
          </div>
          <Link
            href="/jobs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F7A6C] px-5 py-3 text-sm font-bold text-white hover:bg-[#155A4F] transition-colors"
          >
            <Plus className="h-4 w-4" /> Post Opportunity
          </Link>
        </div>
        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Could not load your postings. Refresh to try again.
          </div>
        ) : (
          <MyPostingsList postings={(data ?? []) as MyPosting[]} />
        )}
      </div>
    </main>
  );
}
