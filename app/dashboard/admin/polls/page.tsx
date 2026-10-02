import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, BarChart2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const metadata = {
  title: "Manage Polls | Admin",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPollsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

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
          <h1 className="text-2xl font-bold tracking-tight text-[#1B2A4A]">Campus Polls</h1>
          <p className="text-gray-500 text-sm mt-1">Manage active polls and view live results.</p>
        </div>
        <Button asChild className="bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy font-semibold transition-colors">
          <Link href="/dashboard/admin/polls/new">
            <Plus className="w-4 h-4 mr-2" /> New Poll
          </Link>
        </Button>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">Poll Question</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-center">Votes</th>
                <th className="px-6 py-4 font-semibold">Date Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formattedPolls.length > 0 ? (
                formattedPolls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-md">
                      <span className="line-clamp-2">{poll.question}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        poll.status === 'published' ? 'bg-green-100 text-green-800' :
                        poll.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {poll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {poll.category.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-upsa-navy">
                      {poll.total_votes}
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {format(new Date(poll.created_at), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild title="View Results" className="text-gray-400 hover:text-upsa-navy">
                        <Link href={`/polls/${poll.slug}`}>
                          <BarChart2 className="w-4 h-4" />
                        </Link>
                      </Button>
                      {poll.status === 'draft' && (
                        <Button variant="ghost" size="icon" asChild title="Edit" className="text-gray-400 hover:text-amber-600">
                          <Link href={`/dashboard/admin/polls/${poll.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" title="Delete" className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <BarChart2 className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="font-semibold text-gray-600">No polls yet</p>
                      <p className="text-gray-400 text-sm">Create your first poll to engage the student body.</p>
                      <Button asChild size="sm" className="mt-2 bg-upsa-navy text-white">
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
