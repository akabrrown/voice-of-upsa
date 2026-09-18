import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { 
   Calendar, 
   Clock, 
   Share2, 
   Printer
} from "lucide-react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleActions } from "@/components/articles/ArticleActions";
import { ViewTracker } from "@/components/articles/ViewTracker";
import { ArticleReactions } from "@/components/articles/ArticleReactions";
import { CommentsSection } from "@/components/articles/CommentsSection";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleContent } from "@/components/articles/ArticleContent";
import { UserAvatar } from "@/components/ui/user-avatar";

interface RelatedArticleRaw {
  id: string;
  title: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  reading_time_minutes?: number | null;
  published_at?: string | null;
  slug: string;
  categories?: { name: string } | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, cover_image_url, published_at, profiles:profiles!author_id(full_name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    return {
      title: "Article Not Found | Voice of UPSA",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceofupsa.com";
  const articleUrl = `${siteUrl}/articles/${slug}`;
  
  // WhatsApp crawler strictly requires images < 300KB and prefers 1200x630 JPEG
  let ogImageUrl = article.cover_image_url || `${siteUrl}/og-image.jpg`;
  if (article.cover_image_url) {
    if (article.cover_image_url.includes("res.cloudinary.com") && article.cover_image_url.includes("/image/upload/")) {
      ogImageUrl = article.cover_image_url.replace(
        "/image/upload/",
        "/image/upload/c_fill,w_1200,h_630,q_auto:good,f_jpg/"
      );
    }
  }

  const authorName = (article.profiles as any)?.full_name || "Voice of UPSA Editorial Team";

  return {
    title: `${article.title} | Voice of UPSA`,
    description: article.excerpt || "Read the full story on Voice of UPSA, the official student and campus news publication of the University of Professional Studies, Accra.",
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt || "Read the latest campus news from University of Professional Studies, Accra.",
      url: articleUrl,
      siteName: "Voice of UPSA",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: article.title,
        },
      ],
      type: "article",
      publishedTime: article.published_at || undefined,
      authors: [authorName],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt || "Read the latest news on Voice of UPSA.",
      images: [ogImageUrl],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the article details
  const { data: dbArticle } = await supabase
    .from("articles")
    .select("*, profiles:profiles!author_id(full_name, avatar_url, bio, role), categories(id, name, slug)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!dbArticle) {
    notFound();
  }

  // View count increment is now handled asynchronously on the client via ViewTracker

  // Fetch related articles from same category (excluding this article)
  let { data: dbRelated } = await supabase
    .from("articles")
    .select("*, categories(name)")
    .eq("category_id", dbArticle.category_id)
    .eq("status", "published")
    .neq("id", dbArticle.id)
    .order("published_at", { ascending: false })
    .limit(4);

  // If category has fewer than 4 articles, supplement with latest published campus stories
  if (!dbRelated || dbRelated.length < 4) {
    const existingIds = [dbArticle.id, ...(dbRelated?.map((r: any) => r.id) || [])];
    const { data: extraArticles } = await supabase
      .from("articles")
      .select("*, categories(name)")
      .eq("status", "published")
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(4 - (dbRelated?.length || 0));

    if (extraArticles && extraArticles.length > 0) {
      dbRelated = [...(dbRelated || []), ...extraArticles];
    }
  }

  const article = {
    title: dbArticle.title,
    category: dbArticle.categories?.name || "News",
    categorySlug: dbArticle.categories?.slug || "news",
    date: dbArticle.published_at ? new Date(dbArticle.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : "Recent",
    readTime: dbArticle.reading_time_minutes ? `${dbArticle.reading_time_minutes} min read` : "3 min read",
    author: {
      name: dbArticle.profiles?.full_name || "Editorial Team",
      role: dbArticle.profiles?.role || "Editor",
      bio: dbArticle.profiles?.bio || "Voice of UPSA editorial team member.",
      avatar: dbArticle.profiles?.avatar_url || null
    },
    coverImage: dbArticle.cover_image_url || "https://images.unsplash.com/photo-1523050335102-c32509142279?q=80&w=2000",
    content: dbArticle.content,
  };

  const relatedArticles = dbRelated?.map((rel: RelatedArticleRaw) => ({
    title: rel.title,
    excerpt: rel.excerpt || "",
    category: rel.categories?.name || "News",
    date: rel.published_at ? new Date(rel.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : "Recent",
    readTime: rel.reading_time_minutes ? `${rel.reading_time_minutes} min read` : "3 min read",
    image: rel.cover_image_url || "https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=800",
    slug: rel.slug,
  })) || [];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceofupsa.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    image: [article.coverImage],
    datePublished: dbArticle.published_at || dbArticle.created_at,
    dateModified: dbArticle.updated_at || dbArticle.published_at || dbArticle.created_at,
    author: [{
      "@type": "Person",
      name: article.author.name,
      jobTitle: article.author.role,
    }],
    publisher: {
      "@type": "Organization",
      name: "Voice of UPSA",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    description: dbArticle.excerpt || article.title,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/articles/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <ViewTracker articleId={dbArticle.id} />
      <main className="flex-1 bg-white">
        {/* Article Header & Content */}
        <article className="pt-10 pb-20">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Header: Breadcrumbs, Badge, Title & Meta */}
            <div className="max-w-4xl mx-auto mb-10 space-y-4 text-left">
              <nav className="flex items-center justify-start space-x-2 text-sm text-gray-400">
                <Link href="/" className="hover:text-upsa-navy transition-colors">Home</Link>
                <span>/</span>
                <Link href={`/categories/${article.categorySlug}`} className="hover:text-upsa-navy transition-colors">{article.category}</Link>
              </nav>

              <Badge className="bg-upsa-gold text-upsa-navy font-bold uppercase tracking-widest text-[10px]">
                {article.category}
              </Badge>

              <h1 className="text-3xl md:text-5xl font-black text-upsa-navy leading-tight tracking-tight text-left">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center justify-start gap-4 sm:gap-6 pt-2 text-sm text-gray-500 border-b border-gray-100 pb-6">
                <div className="flex items-center">
                  <UserAvatar
                    src={article.author.avatar}
                    name={article.author.name}
                    size="md"
                    className="mr-3 border border-gray-200"
                  />
                  <span className="font-bold text-upsa-navy">{article.author.name}</span>
                </div>
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5 text-upsa-gold" /> {article.date}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-upsa-gold" /> {article.readTime}</span>
                <div className="flex-1 hidden md:block" />
                <ArticleActions slug={slug} title={article.title} />
              </div>
            </div>

            {/* Main Editorial Grid: Content (8 cols) + Sticky Trending Sidebar (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
              <div className="lg:col-span-8 space-y-8">
                {/* Cover Image */}
                <div className="relative aspect-video md:aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Article Content */}
                <ArticleContent content={article.content} />

                {/* Article Reactions */}
                <ArticleReactions articleId={dbArticle.id} />

                {/* Author Bio */}
                <div className="mt-12 p-6 md:p-8 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                  <UserAvatar
                    src={article.author.avatar}
                    name={article.author.name}
                    size="2xl"
                    className="shrink-0 border-4 border-white shadow-md"
                  />
                  <div className="text-center md:text-left">
                    <h4 className="text-lg font-bold text-upsa-navy mb-1">{article.author.name}</h4>
                    <p className="text-xs uppercase tracking-widest text-upsa-gold font-bold mb-2">{article.author.role}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{article.author.bio}</p>
                  </div>
                </div>

                {/* Comments Section */}
                <CommentsSection articleId={dbArticle.id} />
              </div>

              {/* Sticky Sidebar: Top Trending Stories + Newsletter Form */}
              <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-8">
                  <TrendingSidebar />
                </div>
              </div>
            </div>

            {/* Related Articles Across Full Width */}
            {relatedArticles.length > 0 && (
              <div className="mt-20 pt-12 border-t border-gray-100 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-upsa-navy uppercase tracking-tight">Related Stories & Campus Highlights</h3>
                  <Link href={`/categories/${article.categorySlug}`} className="text-sm font-semibold text-upsa-gold hover:text-upsa-navy transition-colors">
                    View All in {article.category} →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {relatedArticles.map((rel) => (
                    <ArticleCard key={rel.slug} {...rel} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
