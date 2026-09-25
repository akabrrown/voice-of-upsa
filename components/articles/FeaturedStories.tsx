import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronRight } from "lucide-react";
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

  // Fetch up to 4 featured articles for a perfect bento grid (1 large + 3 small or 1 large + 2 medium)
  let { data: articles } = await supabase
    .from("articles")
    .select("*, categories(name), profiles:profiles!author_id(full_name)")
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(4);

  // Fallback to latest published articles if no featured articles are set
  if (!articles || articles.length === 0) {
    const { data: fallbackArticles } = await supabase
      .from("articles")
      .select("*, categories(name), profiles:profiles!author_id(full_name)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4);
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
  const secondaryArticles = featuredList.slice(1, 4); // Up to 3 side articles

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 bg-upsa-gold rounded-full"></div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-upsa-navy tracking-tight">Top Stories</h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">Curated highlights from the editorial desk</p>
          </div>
        </div>
        <Link href="/categories/all" className="group flex items-center gap-1.5 text-sm font-semibold text-upsa-gold hover:text-upsa-navy transition-colors">
          View all coverage <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main large featured article (Left side, spanning 7 or 8 columns depending on grid) */}
        <div className={secondaryArticles.length > 0 ? "lg:col-span-7 flex" : "lg:col-span-12 flex"}>
          <Link 
            href={`/articles/${mainArticle.slug}`} 
            className="group relative w-full rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200/50 hover:shadow-upsa-gold/10 transition-all duration-500 min-h-[450px] lg:min-h-[600px] flex flex-col justify-end"
          >
            <Image
              src={mainArticle.image}
              alt={mainArticle.title}
              fill sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              priority
            />
            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-upsa-navy via-upsa-navy/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 p-6 md:p-10 flex flex-col justify-end h-full">
              <div className="mb-4">
                <Badge className="bg-upsa-gold/90 hover:bg-upsa-gold text-upsa-navy font-bold backdrop-blur-md border-none px-3 py-1 shadow-lg">
                  {mainArticle.category}
                </Badge>
              </div>
              
              <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-white leading-[1.1] mb-4 group-hover:text-upsa-gold transition-colors duration-300">
                {mainArticle.title}
              </h3>
              
              <p className="text-gray-200 text-sm md:text-base lg:text-lg line-clamp-2 max-w-3xl font-light mb-6 opacity-90">
                {mainArticle.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm font-medium text-gray-300">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-upsa-gold" /> {mainArticle.date}</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-upsa-gold" /> {mainArticle.readTime}</span>
                <span className="flex items-center gap-2 text-white border-l border-white/20 pl-6">By {mainArticle.author}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary featured articles (Right side, spanning 5 columns) */}
        {secondaryArticles.length > 0 && (
          <div className="lg:col-span-5 flex flex-col gap-6">
            {secondaryArticles.map((art, index) => (
              <Link 
                key={art.id}
                href={`/articles/${art.slug}`}
                className="group relative flex items-center gap-5 p-4 md:p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out flex-1"
              >
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                  <Image
                    src={art.image}
                    alt={art.title}
                    fill sizes="128px"
                    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                  {/* Subtle inner shadow for premium feel */}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl pointer-events-none" />
                </div>
                
                <div className="flex flex-col justify-center py-1">
                  <span className="text-[11px] font-bold text-upsa-gold uppercase tracking-widest mb-1">
                    {art.category}
                  </span>
                  <h4 className="text-base md:text-lg font-bold text-upsa-navy leading-tight group-hover:text-upsa-gold transition-colors duration-200 line-clamp-3 mb-3">
                    {art.title}
                  </h4>
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-400">
                    <span>{art.date}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{art.readTime}</span>
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
