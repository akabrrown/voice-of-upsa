"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { BarChart3, Eye, FileText, Award } from "lucide-react";
import { StatsShadowLoader, ChartShadowLoader } from "@/components/ui/shadow-loaders";

interface CategoryData {
  name: string;
  count: number;
  views: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface ViewTrendData {
  month: string;
  rawDate: number;
  articles: number;
  views: number;
  avgViews: number;
  isCurrentMonth: boolean;
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    avgViews: 0,
    featuredCount: 0,
  });
  
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [viewTrendData, setViewTrendData] = useState<ViewTrendData[]>([]);

  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all articles
        const { data: articles, error } = await supabase
          .from("articles")
          .select("*, categories(name)");

        if (error) throw error;

        if (articles) {
          const totalArticles = articles.length;
          const totalViews = articles.reduce((sum, a) => sum + (a.view_count || 0), 0);
          const avgViews = totalArticles > 0 ? Math.round(totalViews / totalArticles) : 0;
          const featuredCount = articles.filter(a => a.is_featured).length;

          setStats({
            totalArticles,
            totalViews,
            avgViews,
            featuredCount,
          });

          // Process categories views / count
          const catMap: { [key: string]: { name: string; count: number; views: number } } = {};
          articles.forEach(art => {
            const catName = art.categories?.name || "Uncategorized";
            if (!catMap[catName]) {
              catMap[catName] = { name: catName, count: 0, views: 0 };
            }
            catMap[catName].count += 1;
            catMap[catName].views += art.view_count || 0;
          });

          setCategoryData(Object.values(catMap));

          // Process status data for Pie Chart
          const statusMap: { [key: string]: number } = { draft: 0, review: 0, published: 0, archived: 0 };
          articles.forEach(art => {
            const status = art.status || "draft";
            if (statusMap[status] !== undefined) {
              statusMap[status] += 1;
            }
          });

          setStatusData([
            { name: "Drafts", value: statusMap.draft, color: "#9ca3af" },
            { name: "In Review", value: statusMap.review, color: "#f59e0b" },
            { name: "Published", value: statusMap.published, color: "#10b981" },
            { name: "Archived", value: statusMap.archived, color: "#ef4444" },
          ].filter(item => item.value > 0));

          // Process publication trend (group by month/year for published content)
          const publishedArticles = articles.filter(a => a.status === "published");
          
          const now = new Date();
          const currentMonthKey = now.toLocaleString("en-US", { month: "short", year: "2-digit" });

          const trendMap: { [key: string]: ViewTrendData } = {};

          // Sort articles chronologically by publication date
          const sorted = [...publishedArticles].sort((a, b) => {
            const timeA = new Date(a.published_at || a.created_at).getTime();
            const timeB = new Date(b.published_at || b.created_at).getTime();
            return timeA - timeB;
          });

          sorted.forEach(art => {
            const date = new Date(art.published_at || art.created_at);
            const key = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
            const isCurrent = key === currentMonthKey;
            const displayMonth = isCurrent ? `${key}*` : key;

            if (!trendMap[key]) {
              trendMap[key] = {
                month: displayMonth,
                rawDate: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
                articles: 0,
                views: 0,
                avgViews: 0,
                isCurrentMonth: isCurrent,
              };
            }
            trendMap[key].articles += 1;
            trendMap[key].views += art.view_count || 0;
          });

          // Calculate normalized average views per published story
          Object.values(trendMap).forEach(item => {
            item.avgViews = item.articles > 0 ? Math.round(item.views / item.articles) : 0;
          });

          // Sort chronologically by calendar month timestamp
          const trendList = Object.values(trendMap).sort((a, b) => a.rawDate - b.rawDate);
          setViewTrendData(trendList);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [supabase]);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">System Analytics</h1>
        <p className="text-gray-500">Insights into content performance and reader engagement</p>
      </div>

      {isLoading ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <StatsShadowLoader count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartShadowLoader height="h-80" />
            <ChartShadowLoader height="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Articles</CardTitle>
                <FileText className="h-4 w-4 text-upsa-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.totalArticles}</div>
                <p className="text-xs text-gray-400 mt-1">All content created</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-upsa-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.totalViews.toLocaleString()}</div>
                <p className="text-xs text-gray-400 mt-1">Direct page views</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Avg Views / Post</CardTitle>
                <BarChart3 className="h-4 w-4 text-upsa-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.avgViews.toLocaleString()}</div>
                <p className="text-xs text-gray-400 mt-1">Engagement ratio</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">Featured Stories</CardTitle>
                <Award className="h-4 w-4 text-upsa-navy" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-upsa-navy">{stats.featuredCount}</div>
                <p className="text-xs text-gray-400 mt-1">Hero placement status</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-upsa-navy">Views by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11, fontWeight: "bold" }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="views" fill="#0f2942" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No category data.</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold text-upsa-navy">Publication Trend & Performance</CardTitle>
                  <p className="text-xs text-gray-400 mt-0.5">Dual-axis view: Monthly volume vs readership velocity (*ongoing month)</p>
                </div>
              </CardHeader>
              <CardContent className="h-80">
                {viewTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={viewTrendData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 11, fontWeight: "bold" }} />
                      
                      {/* Left Axis: Views & Avg Views */}
                      <YAxis 
                        yAxisId="views" 
                        orientation="left" 
                        stroke="#cfa12f" 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                      />
                      
                      {/* Right Axis: Published Articles Count */}
                      <YAxis 
                        yAxisId="articles" 
                        orientation="right" 
                        stroke="#0f2942" 
                        allowDecimals={false}
                        tick={{ fontSize: 11 }}
                      />
                      
                      <Tooltip 
                        formatter={(value: any, name: any) => {
                          if (name === "Total Views" || name === "Avg Views / Story") {
                            return [Number(value).toLocaleString(), name];
                          }
                          return [`${value} posts`, name];
                        }}
                      />
                      
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "0px" }}
                      />
                      
                      <Line 
                        yAxisId="views" 
                        type="monotone" 
                        dataKey="views" 
                        name="Total Views" 
                        stroke="#cfa12f" 
                        strokeWidth={3} 
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        yAxisId="views" 
                        type="monotone" 
                        dataKey="avgViews" 
                        name="Avg Views / Story" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        strokeDasharray="4 4"
                      />
                      <Line 
                        yAxisId="articles" 
                        type="monotone" 
                        dataKey="articles" 
                        name="Published Articles" 
                        stroke="#0f2942" 
                        strokeWidth={2} 
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No published trend data.</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-upsa-navy">Content States</CardTitle>
              </CardHeader>
              <CardContent className="h-72 flex flex-col justify-between">
                {statusData.length > 0 ? (
                  <>
                    <div className="h-48 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {statusData.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-bold text-gray-500">{item.name} ({item.value})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No status data.</div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-upsa-navy">Production by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" stroke="#9ca3af" width={100} tick={{ fontSize: 11, fontWeight: "bold" }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#cfa12f" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">No production data.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
