import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/auth/urls";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/auth/",
          "/admin/",
          "/_next/",
          "/*?*status=*",
          "/*?*query=*",
        ],
      },
      {
        // Explicitly block AI scraper bots from wasting bandwidth and CPU
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Bytespider",
          "cohere-ai",
        ],
        disallow: ["/api/", "/dashboard/", "/auth/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
