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

import { getSiteUrl } from "@/lib/auth/urls";
import { getOptimizedOgImage } from "@/lib/utils/og-image";

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
    .select("title, excerpt, cover_image_url, published_at, updated_at, author_name, profiles:profiles!author_id(full_name), categories(name)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    return {
      title: "Article Not Found | Voice of UPSA",
    };
  }

  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/articles/${slug}`;
  const ogImage = getOptimizedOgImage(article.cover_image_url, article.title, siteUrl);
  const authorName = (article as any).author_name || (article.profiles as any)?.full_name || "Voice of UPSA Editorial Team";
  const categoryName = (article.categories as any)?.name || "News";
  const description =
    article.excerpt?.trim() ||
    "Read the full story on Voice of UPSA, the official student and campus news publication of the University of Professional Studies, Accra.";

  return {
    title: `${article.title} | Voice of UPSA`,
    description,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.title,
      description,
      url: articleUrl,
      siteName: "Voice of UPSA",
      locale: "en_GH",
      type: "article",
      publishedTime: article.published_at || undefined,
      modifiedTime: (article as any).updated_at || undefined,
      section: categoryName,
      authors: [authorName],
      images: [
        {
          url: ogImage.url,
          secureUrl: ogImage.secureUrl,
          width: ogImage.width,
          height: ogImage.height,
          alt: article.title,
          type: ogImage.type,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [ogImage.url],
      site: "@voiceofupsa",
      creator: "@voiceofupsa",
    },
    other: {
      "og:image:secure_url": ogImage.secureUrl,
      "og:image:type": ogImage.type,
      "og:image:width": String(ogImage.width),
      "og:image:height": String(ogImage.height),
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the article details with author and publisher profiles
  const { data: dbArticle } = await supabase
    .from("articles")
    .select("*, profiles:profiles!author_id(full_name, avatar_url, bio, role), publisher:profiles!publisher_id(full_name), categories(id, name, slug)")
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

  const isGuestAuthor = Boolean(dbArticle.author_name);
  const authorName = dbArticle.author_name || dbArticle.profiles?.full_name || "Editorial Staff";
  const authorRole = dbArticle.author_title || (isGuestAuthor ? "Guest Contributor" : (dbArticle.profiles?.role || "Staff Writer"));
  const authorBio = isGuestAuthor
    ? "Guest contributor to Voice of UPSA."
    : (dbArticle.profiles?.bio || "Voice of UPSA editorial team member.");
  const authorAvatar = isGuestAuthor ? null : (dbArticle.profiles?.avatar_url || null);
  const publisherName = (dbArticle as any).publisher?.full_name || null;

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
      name: authorName,
      role: authorRole,
      bio: authorBio,
      avatar: authorAvatar,
      isGuest: isGuestAuthor,
    },
    publisherName,
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
    image: rel.cover_image_url || "/campus.png",
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
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">By</span>
                      <span className="font-bold text-upsa-navy">{article.author.name}</span>
                    </div>
                    {article.author.role && (
                      <span className="text-[11px] text-gray-400 block">{article.author.role}</span>
                    )}
                  </div>
                </div>
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-1.5 text-upsa-gold" /> {article.date}</span>
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-upsa-gold" /> {article.readTime}</span>
                {article.publisherName && article.publisherName !== article.author.name && (
                  <span className="hidden sm:inline-flex items-center text-xs text-gray-400">
                    Published by <span className="font-medium text-gray-600 ml-1">{article.publisherName}</span>
                  </span>
                )}
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
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">About the Author</span>
                    <h4 className="text-lg font-bold text-upsa-navy mb-1">{article.author.name}</h4>
                    <p className="text-xs uppercase tracking-widest text-upsa-gold font-bold mb-2">{article.author.role}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{article.author.bio}</p>
                    {article.publisherName && article.publisherName !== article.author.name && (
                      <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200/60">
                        Reviewed &amp; published by <strong className="text-gray-600">{article.publisherName}</strong>
                      </p>
                    )}
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
