"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Eye, 
  Clock, 
  PlusCircle, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { StatsShadowLoader, TableShadowLoader } from "@/components/ui/shadow-loaders";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number;
  created_at: string;
  categories?: {
    name: string;
  };
}

export default function EditorDashboard() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("Editor");
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    publishedCount: 0,
    pendingCount: 0,
  });
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchEditorData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch User Profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserName(profile.full_name);
        }

        // Fetch Articles by Author
        const { data: articles, error } = await supabase
          .from("articles")
          .select("*, categories(name)")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (articles) {
          const totalArticles = articles.length;
          const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);
          const publishedCount = articles.filter(a => a.status === "published").length;
          const pendingCount = articles.filter(a => a.status === "review").length;

          setStats({
            totalArticles,
            totalViews,
            publishedCount,
            pendingCount,
          });

          setRecentArticles(articles.slice(0, 5));
        }
      } catch (err) {
        console.error("Error fetching editor dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEditorData();
  }, [mounted, supabase]);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Welcome, {userName}!</h1>
        <p className="text-gray-500">Workspace overview, submission updates, and content performance metrics</p>
      </div>

      {isLoading ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <StatsShadowLoader count={4} />
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <TableShadowLoader rows={4} hasSearch={false} />
          </div>
        </div>
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">My Total Articles</CardTitle>
                <FileText className="h-4 w-4 text-upsa-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.totalArticles}</div>
                <p className="text-xs text-gray-400 mt-1">All drafts and posts</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-upsa-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-gray-400 mt-1">Reader impressions</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Published</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.publishedCount}</div>
                <p className="text-xs text-gray-400 mt-1">Live on site</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Review</CardTitle>
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.pendingCount}</div>
                <p className="text-xs text-gray-400 mt-1">Awaiting admin action</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Articles */}
            <Card className="lg:col-span-2 border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-upsa-navy">My Recent Drafts & Posts</CardTitle>
                <Button asChild size="sm" variant="outline" className="text-xs border-upsa-navy/10 text-upsa-navy hover:bg-upsa-navy hover:text-white">
                  <Link href="/dashboard/editor/articles">View All My Articles</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentArticles.length > 0 ? (
                    recentArticles.map((art) => (
                      <div key={art.id} className="flex items-center justify-between pb-6 border-b border-gray-50 last:border-none last:pb-0">
                        <div className="space-y-1 pr-4">
                          <Link href={`/articles/${art.slug}`} className="font-bold text-upsa-navy hover:text-upsa-gold transition-colors line-clamp-1">
                            {art.title}
                          </Link>
                          <div className="flex items-center space-x-2 text-xs text-gray-400">
                            <span>{art.categories?.name || "Uncategorized"}</span>
                            <span>•</span>
                            <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {art.created_at ? new Date(art.created_at).toLocaleDateString() : "Recent"}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{art.view_count.toLocaleString()} Views</div>
                            <div className="capitalize text-[10px] font-bold text-gray-400 mt-0.5">{art.status === "review" ? "pending review" : art.status}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 italic text-sm">You haven't written any articles yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-upsa-navy">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold py-6 rounded-xl transition-all shadow-md">
                  <Link href="/dashboard/editor/articles/new">
                    <PlusCircle className="mr-2 h-5 w-5" /> Write New Article
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-upsa-navy/10 text-upsa-navy hover:bg-upsa-navy/5 font-bold py-6 rounded-xl transition-all">
                  <Link href="/profile">
                    Edit Profile Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
