"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
}

export function BreakingNews() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchBreakingNews = async () => {
      try {
        const { data, error } = await supabase
          .from("articles")
          .select("id, title, slug")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        if (data) {
          setNewsItems(
            (data as NewsItem[]).map((item: NewsItem) => ({
              id: item.id,
              title: item.title,
              slug: item.slug,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching breaking news:", err);
      }
    };

    fetchBreakingNews();
  }, [supabase]);

  if (newsItems.length === 0) {
    return null;
  }

  // Duplicate items twice to ensure a smooth continuous loop
  const displayItems = [...newsItems, ...newsItems, ...newsItems];

  return (
    <div className="bg-upsa-gold text-upsa-navy py-2 overflow-hidden border-b border-upsa-navy/10 relative z-50">
      <div className="container mx-auto px-4 flex items-center">
        <div className="flex items-center font-bold text-xs uppercase tracking-widest mr-4 whitespace-nowrap bg-upsa-gold relative z-10 pr-2">
          <Megaphone className="h-4 w-4 mr-2" />
          Breaking News
        </div>
        <div className="flex-1 relative h-6 overflow-hidden">
          <div className="absolute top-0 flex whitespace-nowrap animate-marquee">
            {displayItems.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                href={`/articles/${item.slug}`}
                className="inline-block text-sm font-medium mr-12 hover:underline focus:outline-none"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
