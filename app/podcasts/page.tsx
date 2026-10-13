"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Headphones, Rss } from "lucide-react";
import Link from "next/link";
import { StatsShadowLoader } from "@/components/ui/shadow-loaders";
import Image from "next/image";

interface Show {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string;
  episodes?: [{ count: number }];
}

export default function PodcastsPage() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/podcasts")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShows(data.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-upsa-gold/20 rounded-full mb-4">
          <Mic className="h-8 w-8 text-upsa-navy" />
        </div>
        <h1 className="text-4xl font-black text-upsa-navy tracking-tight mb-4">VOU Podcasts</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Listen to campus voices, academic insights, and student stories. Subscribe via RSS or your favorite podcast app.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsShadowLoader count={3} />
        </div>
      ) : shows.length === 0 ? (
        <Card className="border-none shadow-sm bg-gray-50 text-center py-16">
          <CardContent>
            <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600">No shows available</h3>
            <p className="text-gray-500 mt-2">Check back later for new audio content.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shows.map((show) => (
            <Link key={show.id} href={`/podcasts/${show.slug}`} className="group block">
              <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden bg-white hover:-translate-y-1">
                <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                  {show.cover_image_url ? (
                    <Image 
                      src={show.cover_image_url} 
                      alt={show.title} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Mic className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-upsa-navy backdrop-blur-sm border-none shadow-sm font-bold uppercase tracking-wider text-[10px]">
                      {show.category.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="px-5 pt-5 pb-2">
                  <CardTitle className="text-xl font-black text-upsa-navy group-hover:text-upsa-gold transition-colors line-clamp-1">
                    {show.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                    {show.description}
                  </p>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-4 border-t border-gray-100">
                    <span className="flex items-center">
                      <Headphones className="h-3.5 w-3.5 mr-1.5" />
                      {show.episodes?.[0]?.count || 0} Episodes
                    </span>
                    <span className="flex items-center text-upsa-navy hover:text-upsa-gold transition-colors">
                      <Rss className="h-3.5 w-3.5 mr-1.5" />
                      RSS Feed
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}
