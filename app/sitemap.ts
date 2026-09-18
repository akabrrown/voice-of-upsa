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
      url: `${siteUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
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
      priority: 0.4,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    const supabase = getAdminClient();

    const { data: categories } = await supabase
      .from("categories")
      .select("slug, created_at");

    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${siteUrl}/categories/${cat.slug}`,
      lastModified: cat.created_at ? new Date(cat.created_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

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

    return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
  } catch {
    return staticRoutes;
  }
}
