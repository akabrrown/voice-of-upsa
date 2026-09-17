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
  const [currentIndex, setCurrentIndex] = useState(0);
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

  useEffect(() => {
    if (newsItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [newsItems]);

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-upsa-gold text-upsa-navy py-2 overflow-hidden border-b border-upsa-navy/10">
      <div className="container mx-auto px-4 flex items-center">
        <div className="flex items-center font-bold text-xs uppercase tracking-widest mr-4 whitespace-nowrap">
          <Megaphone className="h-4 w-4 mr-2" />
          Breaking News
        </div>
        <div className="flex-1 relative h-6 overflow-hidden">
          {newsItems.map((item, index) => (
            <Link
              key={item.id}
              href={`/articles/${item.slug}`}
              className={`absolute inset-0 flex items-center text-sm font-medium transition-all duration-500 transform w-full ${
                index === currentIndex 
                  ? "translate-y-0 opacity-100" 
                  : index < currentIndex 
                    ? "-translate-y-full opacity-0" 
                    : "translate-y-full opacity-0"
              }`}
            >
              <span className="truncate w-full block">{item.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
