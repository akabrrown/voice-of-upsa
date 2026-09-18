import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NewsletterForm } from "./NewsletterForm";
import { UpcomingHolidayWidget } from "@/components/holidays/UpcomingHolidayWidget";

export async function TrendingSidebar() {
  const supabase = await createClient();
  const { data: trendingArticles } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(5);

  return (
    <aside className="space-y-8">
      {/* Upcoming Ghana Public Holiday Countdown */}
      <UpcomingHolidayWidget />

      {/* Trending Articles */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <div className="flex items-center space-x-2 mb-6 border-b border-gray-200 pb-4">
          <TrendingUp className="h-5 w-5 text-upsa-gold" />
          <h2 className="text-lg font-bold text-upsa-navy uppercase tracking-tight">Trending This Week</h2>
        </div>
        
        <div className="space-y-6">
          {trendingArticles && trendingArticles.length > 0 ? (
            trendingArticles.map((article, index) => (
              <div key={article.id} className="flex space-x-4 items-start group">
                <span className="text-3xl font-black text-gray-200 group-hover:text-upsa-gold transition-colors leading-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase h-5 text-upsa-gold border-upsa-gold/30">
                    {article.categories?.name || "News"}
                  </Badge>
                  <Link href={`/articles/${article.slug}`}>
                    <h3 className="text-sm font-bold text-upsa-navy line-clamp-2 hover:text-upsa-gold transition-colors leading-tight">
                      {article.title}
                    </h3>
                  </Link>
                  <div className="flex items-center text-[10px] text-gray-400 font-medium">
                    <Eye className="h-3 w-3 mr-1" />
                    {article.view_count || 0} views
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic text-sm">No trending articles yet.</p>
          )}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-upsa-navy rounded-xl p-6 text-white overflow-hidden relative shadow-lg">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-upsa-gold rounded-full opacity-10" />
        <h3 className="text-lg font-bold mb-1 relative z-10">Stay In The Loop!</h3>
        <p className="text-xs text-gray-300 mb-4 relative z-10 leading-relaxed">Subscribe to the official Voice of UPSA weekly digest for academics, SRC news, and campus events.</p>
        <NewsletterForm />
      </div>
    </aside>
  );
}
