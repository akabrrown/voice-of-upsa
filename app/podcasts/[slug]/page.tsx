"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Clock, Calendar, Rss, Copy, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { StatsShadowLoader } from "@/components/ui/shadow-loaders";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface Episode {
  id: string;
  title: string;
  slug: string;
  description: string;
  audio_url: string;
  duration_seconds: number;
  published_at: string;
  episode_number: number | null;
  season_number: number | null;
}

interface Show {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  cover_image_url: string;
  itunes_author: string;
  episodes: Episode[];
}

export default function PodcastShowPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [show, setShow] = useState<Show | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/podcasts?show=${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          // Sort episodes newest first
          const sorted = {
            ...data.data,
            episodes: (data.data.episodes || []).filter((e: any) => e.status === 'published' && !e.deleted_at).sort((a: any, b: any) => 
              new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            )
          };
          setShow(sorted);
        }
        setLoading(false);
      });
  }, [slug]);

  const copyRssUrl = () => {
    const url = `${window.location.origin}/podcasts/${slug}/feed.xml`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = (id: string) => {
    setPlayingId(prev => prev === id ? null : id);
    // In a real implementation, this would connect to a global audio player context
    // For Phase 1, we rely on standard HTML5 audio elements managed locally
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <StatsShadowLoader count={1} />
        <StatsShadowLoader count={3} />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-gray-800 mb-4">Show Not Found</h1>
        <p className="text-gray-500">The podcast you're looking for doesn't exist or is currently inactive.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
      {/* Show Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start mb-16">
        <div className="w-full md:w-1/3 shrink-0">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/5">
            {show.cover_image_url ? (
              <Image src={show.cover_image_url} alt={show.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 font-medium">No Cover</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col justify-center py-4">
          <Badge className="w-fit mb-4 bg-upsa-navy/10 text-upsa-navy hover:bg-upsa-navy/20 border-none">
            {show.category.replace('_', ' ').toUpperCase()}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black text-upsa-navy tracking-tight mb-4">
            {show.title}
          </h1>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {show.description}
          </p>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm font-semibold text-gray-500">Hosted by:</span>
            <span className="text-sm font-bold text-upsa-navy">{show.itunes_author}</span>
          </div>

          <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-2 mr-auto">
              <Rss className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-gray-700">RSS Feed</span>
            </div>
            <Button 
              onClick={copyRssUrl}
              variant="outline" 
              className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-all"
            >
              {copied ? (
                <><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Copied URL</>
              ) : (
                <><Copy className="h-4 w-4 mr-2" /> Copy Feed URL</>
              )}
            </Button>
            <Button className="bg-black text-white hover:bg-gray-800 font-bold">
              Apple Podcasts
            </Button>
            <Button className="bg-[#1DB954] text-white hover:bg-[#1ed760] font-bold">
              Spotify
            </Button>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-upsa-navy tracking-tight flex items-center gap-3 mb-6">
          Latest Episodes
          <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-bold">
            {show.episodes.length}
          </Badge>
        </h2>

        {show.episodes.length === 0 ? (
          <Card className="border-none shadow-sm bg-gray-50 text-center py-12">
            <CardContent>
              <p className="text-gray-500 font-medium">No episodes published yet. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {show.episodes.map((ep) => (
              <Card key={ep.id} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 md:pr-4 flex items-start md:items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-gray-50">
                      <Button 
                        onClick={() => togglePlay(ep.id)}
                        size="icon" 
                        className={`h-16 w-16 rounded-full shadow-md transition-all ${
                          playingId === ep.id 
                            ? 'bg-upsa-gold text-upsa-navy hover:bg-yellow-500' 
                            : 'bg-upsa-navy text-white hover:bg-blue-900 group-hover:scale-105'
                        }`}
                      >
                        {playingId === ep.id ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                      </Button>
                    </div>
                    <div className="p-6 grow flex flex-col justify-center">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 mb-3">
                        <span className="flex items-center text-upsa-gold bg-upsa-gold/10 px-2 py-1 rounded-md">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {new Date(ep.published_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {formatDuration(ep.duration_seconds)}
                        </span>
                        {ep.season_number && ep.episode_number && (
                          <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                            S{ep.season_number} E{ep.episode_number}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-upsa-navy mb-2 leading-tight">
                        {ep.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {ep.description}
                      </p>
                      
                      {playingId === ep.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                          <audio 
                            controls 
                            autoPlay 
                            className="w-full h-10 outline-none"
                            src={ep.audio_url}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </main>
      <Footer />
    </div>
  );
}
