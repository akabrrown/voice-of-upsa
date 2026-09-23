import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface FeaturedArticleRaw {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  reading_time_minutes?: number | null;
  published_at?: string | null;
  categories?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export async function FeaturedStories() {
  const supabase = await createClient();

  // Fetch up to 3 featured articles
  let { data: articles } = await supabase
    .from("articles")
    .select("*, categories(name), profiles:profiles!author_id(full_name)")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(3);

  // Fallback to latest published articles if no featured articles are set
  if (!articles || articles.length === 0) {
    const { data: fallbackArticles } = await supabase
      .from("articles")
      .select("*, categories(name), profiles:profiles!author_id(full_name)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);
    articles = fallbackArticles;
  }

  if (!articles || articles.length === 0) {
    return null;
  }

  const formatArticle = (art: FeaturedArticleRaw) => ({
    id: art.id,
    title: art.title,
    excerpt: art.excerpt || "",
    category: art.categories?.name || "Featured",
    date: art.published_at ? new Date(art.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : "Recent",
    readTime: art.reading_time_minutes ? `${art.reading_time_minutes} min read` : "3 min read",
    image: art.cover_image_url || "https://images.unsplash.com/photo-1523050335102-c32509142279?q=80&w=2000",
    slug: art.slug,
    author: (art as any).author_name || art.profiles?.full_name || "Editorial Team"
  });

  const featuredList = articles.map(formatArticle);
  const mainArticle = featuredList[0];
  const secondaryArticles = featuredList.slice(1);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 border-l-4 border-upsa-gold pl-4">
        <div>
          <h2 className="text-2xl font-black text-upsa-navy uppercase tracking-tight">Featured Stories</h2>
          <p className="text-xs text-gray-500 mt-1">Handpicked coverage and top editorial highlights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main large featured article (Left side, spanning 2 columns if there are secondary ones) */}
        <div className={secondaryArticles.length > 0 ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          <Link href={`/articles/${mainArticle.slug}`} className="group block relative aspect-[4/3] sm:aspect-[3/2] md:aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <Image
              src={mainArticle.image}
              alt={mainArticle.title}
              fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500 brightness-[0.6] group-hover:brightness-[0.5]"
              priority
            />
            {/* Soft gold accent border on hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-upsa-gold/30 rounded-2xl transition-all duration-300 pointer-events-none" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-upsa-navy/90 via-upsa-navy/35 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 space-y-2 md:space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-upsa-gold text-upsa-navy hover:bg-white font-bold transition-colors text-[10px] sm:text-xs">
                  {mainArticle.category}
                </Badge>
              </div>
              
              <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-white leading-tight group-hover:text-upsa-gold transition-colors duration-300 line-clamp-2">
                {mainArticle.title}
              </h3>
              
              <p className="text-gray-200 text-xs sm:text-sm md:text-base line-clamp-1 sm:line-clamp-2 max-w-2xl font-light">
                {mainArticle.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-gray-300 pt-1 md:pt-2 font-medium">
                <span className="flex items-center gap-1.5"><Calendar className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-upsa-gold" /> {mainArticle.date}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-upsa-gold" /> {mainArticle.readTime}</span>
                <span className="text-white">By {mainArticle.author}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary featured articles (Right side, stacked) */}
        {secondaryArticles.length > 0 && (
          <div className="space-y-6 flex flex-col justify-between">
            {secondaryArticles.map((art) => (
              <Link 
                key={art.id}
                href={`/articles/${art.slug}`}
                className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-upsa-gold/30 hover:shadow-md transition-all duration-300 flex-1"
              >
                <div className="relative aspect-video sm:aspect-square w-full sm:w-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50">
                  <Image
                    src={art.image}
                    alt={art.title}
                    fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col justify-between space-y-2 flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-upsa-navy uppercase tracking-wider text-upsa-gold">
                      {art.category}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-upsa-navy transition-colors line-clamp-2 mt-1">
                      {art.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-upsa-gold" /> {art.date}</span>
                    <span>By {art.author}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
