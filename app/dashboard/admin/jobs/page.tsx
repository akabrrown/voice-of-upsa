import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, FileEdit } from "lucide-react";
import { format } from "date-fns";
import { JobActionButtons } from "./JobActionButtons";
import { RevisionActionButtons } from "./RevisionActionButtons";

export const metadata = {
  title: "Manage Jobs | Admin",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch postings from the 'jobs' schema without joining public.profiles
  const { data: postings, error } = await supabase
    .schema("jobs")
    .from("postings")
    .select(`
      *,
      category:job_categories(name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin jobs fetch error:", JSON.stringify(error));
  }

  // Fetch pending revisions
  const { data: pendingRevisions } = await supabase
    .schema("jobs")
    .from("posting_revisions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Fetch profiles separately
  let profiles: any[] = [];
  const posterIds = new Set<string>();
  
  if (postings) {
    postings.forEach(p => posterIds.add(p.poster_id));
  }
  if (pendingRevisions) {
    pendingRevisions.forEach(r => posterIds.add(r.poster_id));
  }

  if (posterIds.size > 0) {
    const { data: fetchedProfiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", Array.from(posterIds));
    if (fetchedProfiles) profiles = fetchedProfiles;
  }
  
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
  const postingMap = Object.fromEntries((postings || []).map(p => [p.id, p]));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B2A4A]">Job Board</h1>
          <p className="text-gray-500 text-sm mt-1">Manage job postings, approve or reject pending reviews.</p>
        </div>
        <Button asChild className="bg-[#1B2A4A] hover:bg-gray-900 text-white font-semibold transition-colors">
          <Link href="/dashboard/admin/jobs/new">
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Link>
        </Button>
      </div>

      {pendingRevisions && pendingRevisions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1B2A4A] flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-amber-500" /> Pending Revisions ({pendingRevisions.length})
          </h2>
          <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-amber-800 uppercase bg-amber-50 border-b border-amber-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Original Post</th>
                    <th className="px-6 py-4 font-semibold">Poster</th>
                    <th className="px-6 py-4 font-semibold">Date Submitted</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingRevisions.map((rev) => {
                    const originalPost = postingMap[rev.posting_id];
                    return (
                      <tr key={rev.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 max-w-md line-clamp-1">
                            {originalPost?.title || "Unknown Post"}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                            {Object.keys(rev.proposed_changes).length} field(s) edited
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {profileMap[rev.poster_id] ? `${profileMap[rev.poster_id].first_name} ${profileMap[rev.poster_id].last_name}` : "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                          {format(new Date(rev.created_at), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <RevisionActionButtons revision={rev} originalPost={originalPost} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Title & Org</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Poster</th>
                <th className="px-6 py-4 font-semibold">Date Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {postings && postings.length > 0 ? (
                postings.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 max-w-md line-clamp-1">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.organization_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        job.status === 'approved' ? 'bg-green-100 text-green-800' :
                        job.status === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                        job.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {job.category?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {profileMap[job.poster_id] ? `${profileMap[job.poster_id].first_name} ${profileMap[job.poster_id].last_name}` : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(job.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <JobActionButtons id={job.id} status={job.status} slug={job.slug} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <Briefcase className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="font-semibold text-gray-600">No job postings</p>
                      <p className="text-gray-400 text-sm">There are no job postings in the database yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
