import { ArticleCard } from "./ArticleCard";
import { createClient } from "@/lib/supabase/server";

export async function LatestArticles() {
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("*, categories(name), profiles:profiles!author_id(full_name)")
    .eq("status", "published")
    .neq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(6);

  const mappedArticles = articles?.map((art: any) => ({
    title: art.title,
    excerpt: art.excerpt || "",
    category: art.categories?.name || "News",
    date: art.published_at ? new Date(art.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : "Recent",
    readTime: art.reading_time_minutes ? `${art.reading_time_minutes} min read` : "3 min read",
    image: art.cover_image_url || "https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=800",
    slug: art.slug,
    author: (art as any).author_name || art.profiles?.full_name || "Editorial Team",
  })) || [];

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8 border-l-4 border-upsa-gold pl-4">
        <h2 className="text-2xl font-bold text-upsa-navy uppercase tracking-tight">Latest Articles</h2>
      </div>
      
      {mappedArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedArticles.map((article) => (
            <ArticleCard key={article.slug} {...article} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic text-center py-8">No articles published yet.</p>
      )}
    </section>
  );
}
