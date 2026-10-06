import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { User, Bookmark, History, Calendar, LogOut, Briefcase } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "My Profile | Voice of UPSA",
};

export default async function UserOverviewPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get quick stats
  const { count: bookmarkCount } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const { count: historyCount } = await supabase
    .from("reading_history")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", user.id);

  const { count: postingsCount } = await supabase
    .schema("jobs")
    .from("postings")
    .select("*", { count: "exact", head: true })
    .eq("poster_id", user.id)
    .is("deleted_at", null);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-3 bg-upsa-navy/10 text-upsa-navy rounded-xl">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <UserAvatar 
              name={profile?.full_name || user.email?.split("@")[0] || "User"}
              src={profile?.avatar_url}
              className="h-24 w-24 text-3xl shadow-sm border-2 border-white"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h2>
              <p className="text-gray-500 mb-2">{user.email}</p>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {profile?.role === "public" ? "Student Reader" : profile?.role}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
              <p className="font-semibold text-gray-900">{profile?.department || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Year Group</p>
              <p className="font-semibold text-gray-900">{profile?.year_group || "Not specified"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Bio</p>
              <p className="text-gray-700">{profile?.bio || "No bio added yet."}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats & Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-upsa-navy to-blue-900 rounded-3xl shadow-md p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bookmark className="w-24 h-24" />
            </div>
            <h3 className="text-lg font-bold mb-4 relative z-10">Your Activity</h3>
            
            <div className="space-y-4 relative z-10">
              <Link href="/dashboard/user/bookmarks" className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Bookmark className="h-5 w-5 text-upsa-gold" />
                  <span className="font-medium">Saved Articles</span>
                </div>
                <span className="font-bold bg-white/20 px-2 py-1 rounded-lg text-sm">{bookmarkCount || 0}</span>
              </Link>
              
              <Link href="/dashboard/user/history" className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-upsa-gold" />
                  <span className="font-medium">Reading History</span>
                </div>
                <span className="font-bold bg-white/20 px-2 py-1 rounded-lg text-sm">{historyCount || 0}</span>
              </Link>
              
              <Link href="/jobs/mine" className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-upsa-gold" />
                  <span className="font-medium">My Postings</span>
                </div>
                <span className="font-bold bg-white/20 px-2 py-1 rounded-lg text-sm">{postingsCount || 0}</span>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start rounded-xl" asChild>
                <Link href="/auth/update-password">Change Password</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
