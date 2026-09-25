import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users as UsersIcon, 
  Megaphone, 
  Eye,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Get stats counts
  const { count: totalArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  const { count: activeUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: pendingAds } = await supabase
    .from("advertisements")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: viewsData } = await supabase
    .from("articles")
    .select("view_count");
  const totalViews = viewsData?.reduce((sum, art) => sum + (art.view_count || 0), 0) || 0;

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + "k";
    }
    return views.toString();
  };

  const stats = [
    { name: "Total Articles", value: totalArticles?.toString() || "0", icon: FileText, change: "All time", changeType: "increase" },
    { name: "Active Users", value: activeUsers?.toString() || "0", icon: UsersIcon, change: "Registered", changeType: "increase" },
    { name: "Pending Ads", value: pendingAds?.toString() || "0", icon: Megaphone, change: "Awaiting review", changeType: "decrease" },
    { name: "Total Page Views", value: formatViews(totalViews), icon: Eye, change: "All articles", changeType: "increase" },
  ];

  // 2. Fetch recent content activities
  const { data: recentArticles } = await supabase
    .from("articles")
    .select("*, profiles:profiles!author_id(full_name)")
    .order("updated_at", { ascending: false })
    .limit(4);

  const activities = recentArticles?.map((art) => {
    let action = "updated";
    if (art.status === "published") action = "published an article";
    else if (art.status === "review") action = "submitted for review";
    else if (art.status === "draft") action = "saved a draft";
    
    return {
      user: (art as any).author_name || art.profiles?.full_name || "Unknown Author",
      action,
      item: art.title,
      time: art.updated_at ? new Date(art.updated_at).toLocaleDateString() : "Recent",
      slug: art.slug,
    };
  }) || [];

  // 3. Fetch active ads
  const { data: adsList } = await supabase
    .from("advertisements")
    .select("*")
    .eq("status", "active")
    .limit(3);

  const activeAds = adsList?.map((ad) => {
    return {
      company: ad.company_name,
      tier: ad.package_tier || "Standard",
      impressions: "Active",
      progress: ad.package_tier === "premium" ? 100 : ad.package_tier === "standard" ? 50 : 25,
    };
  }) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Admin Overview</h1>
        <p className="text-gray-500">Global performance and management dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">{stat.name}</CardTitle>
              <div className="p-2 bg-upsa-navy/5 rounded-lg">
                <stat.icon className="h-4 w-4 text-upsa-navy" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-upsa-navy">{stat.value}</div>
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <span className="text-emerald-500 font-bold">
                  {stat.change}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-upsa-navy">Recent Content Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.length > 0 ? (
                activities.map((activity, i) => (
                  <div key={i} className="flex items-start space-x-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="h-10 w-10 rounded-full bg-upsa-gold/10 flex items-center justify-center text-upsa-navy font-bold">
                      {activity.user[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-bold text-upsa-navy">{activity.user}</span>{" "}
                        <span className="text-gray-500">{activity.action}</span>{" "}
                        <span className="font-semibold text-upsa-gold">"{activity.item}"</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {activity.time}
                      </p>
                    </div>
                    <Button asChild size="icon" variant="ghost" className="text-gray-300 hover:text-upsa-navy">
                      <Link href={`/articles/${activity.slug}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 italic text-sm">No recent activity found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ad Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-upsa-navy">Active Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activeAds.length > 0 ? (
                activeAds.map((ad) => (
                  <div key={ad.company} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-upsa-navy">{ad.company}</span>
                      <span className="text-xs text-gray-400 uppercase font-semibold">{ad.tier}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-upsa-gold rounded-full" 
                        style={{ width: `${ad.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 italic text-sm">No active advertisements.</p>
              )}
              <div className="pt-4">
                <Button asChild variant="outline" className="w-full text-xs font-bold border-upsa-navy/10 text-upsa-navy hover:bg-upsa-navy hover:text-white">
                  <Link href="/dashboard/admin/ads">
                    View All Campaigns
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
