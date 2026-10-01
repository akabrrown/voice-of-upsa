import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { History } from "lucide-react";

export const metadata = {
  title: "Reading History | Voice of UPSA",
};

export default async function UserHistoryPage() {
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

  // Fetch recently read articles
  const { data: historyItems, error } = await supabase
    .from("reading_history")
    .select(`
      article_id,
      last_read_at,
      articles (
        id,
        title,
        slug,
        excerpt,
        featured_image,
        category_id,
        published_at,
        reading_time,
        categories (
          name,
          color,
          slug
        )
      )
    `)
    .eq("profile_id", user.id)
    .order("last_read_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Error fetching reading history:", error);
  }

  const readArticles = historyItems?.map((h) => h.articles).filter(Boolean) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-3 bg-upsa-gold/10 text-upsa-gold rounded-xl">
          <History className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Reading History</h1>
          <p className="text-gray-500 mt-1">Articles you've recently viewed.</p>
        </div>
      </div>

      {readArticles.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <History className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No history found</h3>
          <p className="text-gray-500">
            You haven't read any articles recently while logged in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readArticles.map((article: any) => (
            <ArticleCard 
              key={article.id} 
              title={article.title}
              excerpt={article.excerpt}
              category={article.categories?.name || "Uncategorized"}
              date={new Date(article.published_at || article.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              image={article.featured_image || "/placeholder.jpg"}
              slug={article.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
