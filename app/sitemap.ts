import type { MetadataRoute } from "next";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/auth/urls";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/categories/all`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/podcasts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/mart`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/confessions`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/advertise`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/guidelines`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const supabase = getAdminClient();

    const [
      { data: categories },
      { data: articles },
      { data: podcasts },
      { data: products },
    ] = await Promise.all([
      supabase.from("categories").select("slug, created_at"),
      supabase
        .from("articles")
        .select("slug, updated_at, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("podcast_shows")
        .select("slug, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("mart_products")
        .select("slug, updated_at")
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${siteUrl}/categories/${cat.slug}`,
      lastModified: cat.created_at ? new Date(cat.created_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const articleRoutes: MetadataRoute.Sitemap = (articles || []).map((article) => ({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: article.updated_at
        ? new Date(article.updated_at)
        : article.published_at
        ? new Date(article.published_at)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

    const podcastRoutes: MetadataRoute.Sitemap = (podcasts || []).map((show) => ({
      url: `${siteUrl}/podcasts/${show.slug}`,
      lastModified: show.updated_at ? new Date(show.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((prod) => ({
      url: `${siteUrl}/mart/products/${prod.slug}`,
      lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [
      ...staticRoutes,
      ...categoryRoutes,
      ...articleRoutes,
      ...podcastRoutes,
      ...productRoutes,
    ];
  } catch {
    return staticRoutes;
  }
}
