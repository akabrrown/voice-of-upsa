import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { PollAdminActions } from "./PollAdminActions";

export const metadata = {
  title: "Manage Polls | Admin",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPollsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role, is_admin").eq("id", user.id).single();
  const isStaff = profile?.role === "admin" || profile?.role === "editor" || profile?.role === "developer" || profile?.is_admin === true;
  if (!isStaff) redirect("/dashboard");

  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      *,
      options:poll_options(vote_count)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin polls fetch error:", JSON.stringify(error));
  }

  const formattedPolls = (polls || []).map(poll => {
    const total_votes = poll.options.reduce((sum: number, opt: any) => sum + opt.vote_count, 0);
    return { ...poll, total_votes };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1B2A4A] dark:text-white">Campus Polls</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Manage active polls and view live results.</p>
        </div>
        <Button asChild className="bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-gray-950 dark:hover:bg-upsa-gold/90 font-semibold transition-colors">
          <Link href="/dashboard/admin/polls/new">
            <Plus className="w-4 h-4 mr-2" /> New Poll
          </Link>
        </Button>
      </div>

      <div className="bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-slate-400 uppercase bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Poll Question</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-center">Votes</th>
                <th className="px-6 py-4 font-semibold">Date Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {formattedPolls.length > 0 ? (
                formattedPolls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md">
                      <span className="line-clamp-2">{poll.question}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                        poll.status === 'published' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/40' :
                        poll.status === 'draft' ? 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-white/10' :
                        'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/40'
                      }`}>
                        {poll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300 capitalize">
                      {poll.category.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-upsa-navy dark:text-upsa-gold">
                      {poll.total_votes}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {format(new Date(poll.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <PollAdminActions poll={poll} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full">
                        <BarChart2 className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                      </div>
                      <p className="font-semibold text-gray-600 dark:text-slate-300">No polls yet</p>
                      <p className="text-gray-400 dark:text-slate-500 text-sm">Create your first poll to engage the student body.</p>
                      <Button asChild size="sm" className="mt-2 bg-upsa-navy hover:bg-upsa-navy/90 text-white dark:bg-upsa-gold dark:text-gray-950 dark:hover:bg-upsa-gold/90 font-semibold">
                        <Link href="/dashboard/admin/polls/new">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Poll
                        </Link>
                      </Button>
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
