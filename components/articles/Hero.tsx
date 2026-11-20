import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { getPublicClient } from "@/lib/supabase/admin";

const HERO_COLUMNS = "id, title, slug, excerpt, cover_image_url, published_at, reading_time_minutes, categories(name), profiles(full_name)";

export async function Hero() {
  const supabase = getPublicClient();
  
  // Try to find a featured article
  let { data: article } = await supabase
    .from("articles")
    .select(HERO_COLUMNS)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fallback to latest article if no featured article exists
  if (!article) {
    const { data: latest } = await supabase
      .from("articles")
      .select(HERO_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    article = latest;
  }

  if (!article) {
    return (
      <section className="relative w-full h-[400px] bg-upsa-navy flex items-center justify-center text-center px-4">
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold text-white">Voice of UPSA</h1>
          <p className="text-gray-300">Welcome to the official digital gateway to news, events, and professional insights.</p>
        </div>
      </section>
    );
  }

  const dateStr = article.published_at ? new Date(article.published_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }) : "Recent";
  

  const rawArticle: any = article;
  const authorName = rawArticle.author_name || (Array.isArray(rawArticle.profiles) ? rawArticle.profiles[0]?.full_name : rawArticle.profiles?.full_name) || "Editorial Team";
  const categoryName = (Array.isArray(rawArticle.categories) ? rawArticle.categories[0]?.name : rawArticle.categories?.name) || "Featured";
  const imageUrl = rawArticle.cover_image_url || "https://images.unsplash.com/photo-1523050335102-c32509142279?q=80&w=2000";

  return (
    <section className="relative w-full h-[600px] overflow-hidden">
      <Image
        src={imageUrl}
        alt={rawArticle.title}
        fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover brightness-50"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-upsa-navy via-transparent to-transparent opacity-80" />
      
      <div className="container relative mx-auto h-full flex flex-col justify-end pb-16 px-4">
        <div className="max-w-3xl space-y-4">
          <Badge className="bg-upsa-gold text-upsa-navy hover:bg-white font-bold px-3 py-1">
            {categoryName}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            {rawArticle.title}
          </h1>
          <p className="text-lg text-gray-200 line-clamp-2">
            {article.excerpt}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 pt-4 text-gray-300 text-sm">
            <span className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-upsa-gold" /> {dateStr}</span>

            <span className="flex items-center font-semibold text-white">By {authorName}</span>
          </div>
          
          <div className="pt-6">
            <Button asChild size="lg" className="bg-upsa-gold text-upsa-navy hover:bg-white font-bold group">
              <Link href={`/articles/${article.slug}`}>
                Read Full Story
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
