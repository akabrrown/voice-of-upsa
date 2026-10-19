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

  const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
  const isStaff = ['admin', 'editor', 'developer'].includes(profile?.role) || profile?.is_admin === true;
  if (!isStaff) redirect("/dashboard");

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
          <h1 className="text-2xl font-bold tracking-tight text-[#1B2A4A] dark:text-white">Job Board</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Manage job postings, approve or reject pending reviews.</p>
        </div>
        <Button asChild className="bg-[#1B2A4A] hover:bg-gray-900 dark:bg-upsa-gold dark:text-gray-950 dark:hover:bg-upsa-gold/90 text-white font-semibold transition-colors">
          <Link href="/dashboard/admin/jobs/new">
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Link>
        </Button>
      </div>

      {pendingRevisions && pendingRevisions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#1B2A4A] dark:text-white flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-amber-500" /> Pending Revisions ({pendingRevisions.length})
          </h2>
          <div className="bg-white dark:bg-[#0C1729] border border-amber-200 dark:border-amber-800/40 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-amber-800 dark:text-amber-300 uppercase bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Original Post</th>
                    <th className="px-6 py-4 font-semibold">Poster</th>
                    <th className="px-6 py-4 font-semibold">Date Submitted</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {pendingRevisions.map((rev) => {
                    const originalPost = postingMap[rev.posting_id];
                    return (
                      <tr key={rev.id} className="hover:bg-amber-50/30 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 dark:text-white max-w-md line-clamp-1">
                            {originalPost?.title || "Unknown Post"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-slate-400 line-clamp-1 mt-1">
                            {Object.keys(rev.proposed_changes).length} field(s) edited
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                          {profileMap[rev.poster_id] ? `${profileMap[rev.poster_id].first_name} ${profileMap[rev.poster_id].last_name}` : "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
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

      <div className="bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-slate-400 uppercase bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Title & Org</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Poster</th>
                <th className="px-6 py-4 font-semibold">Date Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {postings && postings.length > 0 ? (
                postings.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white max-w-md line-clamp-1">{job.title}</div>
                      <div className="text-xs text-gray-500 dark:text-slate-400">{job.organization_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        job.status === 'approved' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/40' :
                        job.status === 'pending_review' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' :
                        job.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/40' :
                        'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-white/10'
                      }`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {job.category?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {profileMap[job.poster_id] ? `${profileMap[job.poster_id].first_name} ${profileMap[job.poster_id].last_name}` : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
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
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full">
                        <Briefcase className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                      </div>
                      <p className="font-semibold text-gray-600 dark:text-slate-300">No job postings</p>
                      <p className="text-gray-400 dark:text-slate-500 text-sm">There are no job postings in the database yet.</p>
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
