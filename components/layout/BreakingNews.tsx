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

  // Duplicate items heavily to ensure they exceed screen width
  const repeatedItems = Array(10).fill(newsItems).flat();

  return (
    <div className="sticky top-20 z-40 bg-upsa-gold text-upsa-navy py-2 overflow-hidden border-b border-upsa-navy/10 shadow-sm">
      <div className="container mx-auto px-4 flex items-center">
        <div className="flex items-center font-bold text-xs uppercase tracking-widest mr-4 whitespace-nowrap bg-upsa-gold relative z-10 pr-2">
          <Megaphone className="h-4 w-4 mr-2" />
          Breaking News
        </div>
        <div className="flex-1 overflow-hidden flex relative h-6 items-center [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex whitespace-nowrap animate-marquee hover:[animation-play-state:paused]">
            <div className="flex items-center shrink-0 min-w-full justify-around">
              {repeatedItems.map((item, index) => (
                <Link
                  key={`${item.id}-${index}`}
                  href={`/articles/${item.slug}`}
                  className="inline-block text-sm font-medium mx-6 hover:underline focus:outline-none"
                >
                  {item.title}
                </Link>
              ))}
            </div>
            <div className="flex items-center shrink-0 min-w-full justify-around" aria-hidden="true">
              {repeatedItems.map((item, index) => (
                <Link
                  key={`${item.id}-dup-${index}`}
                  href={`/articles/${item.slug}`}
                  className="inline-block text-sm font-medium mx-6 hover:underline focus:outline-none"
                  tabIndex={-1}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
