import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdZone } from "@/components/layout/AdZone";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

interface CategoryInfo {
  name: string;
  description?: string | null;
  banner_url?: string | null;
  id?: string;
}

interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  categories: { name: string } | null;
}

const categoryConfigs: Record<string, { name: string; description: string; banner_url: string }> = {
  all: {
    name: "All Articles",
    description: "Browse our complete catalog of publications, student journals, editorials, and campus coverages.",
    banner_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2000"
  },
  featured: {
    name: "Featured Stories",
    description: "Handpicked premium coverage, deep-dive investigations, and high-impact campus reporting.",
    banner_url: "https://images.unsplash.com/photo-1495020689067-958852a6565d?q=80&w=2000"
  },
  academics: {
    name: "Academics",
    description: "Discover scholarly breakthroughs, school programmes, student research, and scholastic excellence at UPSA.",
    banner_url: "https://images.unsplash.com/photo-1523050335102-c32509142279?q=80&w=2000"
  },
  events: {
    name: "Events",
    description: "Stay up to date with upcoming campus workshops, cultural festivals, guest lectures, and student activities.",
    banner_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2000"
  },
  news: {
    name: "News",
    description: "Get breaking updates, administration circulars, student policies, and local developments affecting UPSA.",
    banner_url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2000"
  },
  opinions: {
    name: "Opinions",
    description: "Engage with perspectives, student debates, editorial columns, and thoughtful letters from the Voice of UPSA community.",
    banner_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2000"
  },
  sports: {
    name: "Sports",
    description: "Follow the tournaments, athlete profiles, match highlights, and trophies of the UPSA sports teams.",
    banner_url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2000"
  },
  politics: {
    name: "Politics",
    description: "Coverage of student governance, general assembly reports, SRC elections, and student leadership campaigns.",
    banner_url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=2000"
  }
};

import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/auth/urls";
import { getOptimizedOgImage } from "@/lib/utils/og-image";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const slug = categorySlug.toLowerCase();
  const config = categoryConfigs[slug];
  const siteUrl = getSiteUrl();

  const title = config ? `${config.name} | Voice of UPSA` : `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)} | Voice of UPSA`;
  const description = config?.description || `Browse the latest ${categorySlug} articles and stories on Voice of UPSA.`;
  const bannerUrl = config?.banner_url || `${siteUrl}/og-image.jpg`;
  const ogImage = getOptimizedOgImage(bannerUrl, title, siteUrl);
  const pageUrl = `${siteUrl}/categories/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Voice of UPSA",
      locale: "en_GH",
      type: "website",
      images: [
        {
          url: ogImage.url,
          secureUrl: ogImage.secureUrl,
          width: ogImage.width,
          height: ogImage.height,
          alt: title,
          type: ogImage.type,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
      site: "@voiceofupsa",
      creator: "@voiceofupsa",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { category: categorySlug } = await params;
  const searchParamsData = await searchParams;
  const supabase = await createClient();
  
  const pageStr = searchParamsData.page;
  const currentPage = typeof pageStr === "string" ? parseInt(pageStr, 10) : 1;
  const limit = 12;
  const from = (currentPage - 1) * limit;
  const to = from + limit - 1;
  
  let totalCount = 0;

  const slug = categorySlug.toLowerCase();
  const config = categoryConfigs[slug];

  let dbCategory: CategoryInfo | null = null;
  let dbArticles: ArticleListItem[] = [];

  if (slug === "all") {
    dbCategory = config;

    const { data, count } = await supabase
      .from("articles")
      .select("*, categories(name)", { count: "exact" })
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);
    dbArticles = data || [];
    totalCount = count || 0;
  } else if (slug === "featured") {
    dbCategory = config;

    const { data, count } = await supabase
      .from("articles")
      .select("*, categories(name)", { count: "exact" })
      .eq("status", "published")
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .range(from, to);
    dbArticles = data || [];
    totalCount = count || 0;
  } else {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    
    if (!data) {
      if (config) {
        dbCategory = config;
      } else {
        notFound();
        return null;
      }
    } else {
      dbCategory = data;
    }

    if (!dbCategory) {
      notFound();
      return null;
    }

    const { data: articles, count } = await supabase
      .from("articles")
      .select("*, categories(name)", { count: "exact" })
      .eq("category_id", dbCategory.id || '')
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);
    dbArticles = articles || [];
    totalCount = count || 0;
  }

  const totalPages = Math.ceil(totalCount / limit);

  if (!dbCategory) {
    notFound();
    return null;
  }

  const category = {
    name: dbCategory.name,
    description: dbCategory.description || config?.description || `Read the latest articles about ${dbCategory.name} from the Voice of UPSA.`,
    image: dbCategory.banner_url || config?.banner_url || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000"
  };

  const categoryArticles = dbArticles.map((art: ArticleListItem) => ({
    title: art.title,
    excerpt: art.excerpt || "",
    category: art.categories?.name || "News",
    date: art.published_at ? new Date(art.published_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) : "Recent",
    readTime: art.reading_time_minutes ? `${art.reading_time_minutes} min read` : "3 min read",
    image: art.cover_image_url || "/campus.png",
    slug: art.slug,
  }));

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {/* Category Header */}
        <section className="relative bg-upsa-navy text-white py-12 overflow-hidden">
          {/* Cover background layout */}
          <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay" style={{ backgroundImage: `url(${category.image})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-upsa-navy via-upsa-navy/90 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-upsa-gold via-yellow-400 to-upsa-gold" />
          
          <div className="container relative mx-auto px-4 max-w-5xl">
            <div className="max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/10 backdrop-blur-sm border border-white/15 text-[10px] font-bold text-upsa-gold tracking-wider uppercase mb-1">
                Category Archive
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase leading-none drop-shadow-sm">
                {category.name}
              </h1>
              <p className="text-sm md:text-base text-gray-300 font-light max-w-2xl">
                {category.description}
              </p>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-12">
              {categoryArticles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categoryArticles.map((article) => (
                      <ArticleCard key={article.slug} {...article} />
                    ))}
                  </div>
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    baseHref={`/categories/${slug}`} 
                  />
                </>
              ) : (
                <div className="py-24 text-center max-w-md mx-auto space-y-4">
                  <p className="text-gray-400 italic text-lg">No articles found in this category.</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 space-y-8">
              <AdZone type="sidebar" />
              <TrendingSidebar />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
