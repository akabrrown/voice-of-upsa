"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Heart, Laugh, Flag, Loader2, Plus, Filter, ShieldAlert, Phone } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function ConfessionsFeedPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/confessions", window.location.origin);
      if (typeFilter !== "all") url.searchParams.set("type", typeFilter);
      if (categoryFilter !== "all") url.searchParams.set("category", categoryFilter);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
      toast.error("Failed to load confessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [typeFilter, categoryFilter]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50/50 pt-8 pb-20">
        <div className="container max-w-4xl mx-auto px-4">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-upsa-navy tracking-tight mb-2">Campus Confessions</h1>
              <p className="text-gray-500 max-w-lg">The anonymous heartbeat of UPSA. Share your truth, opinions, and experiences safely.</p>
            </div>
            <Button asChild className="bg-upsa-navy hover:bg-upsa-navy/90 text-white shrink-0">
              <Link href="/confessions/new"><Plus className="w-4 h-4 mr-2" /> Post Anonymously</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mr-2">
                  <Filter className="w-4 h-4" /> Filter by:
                </div>
                
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setTypeFilter("all")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'all' ? 'bg-white shadow-sm text-upsa-navy' : 'text-gray-500 hover:text-gray-900'}`}>All</button>
                  <button onClick={() => setTypeFilter("confession")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'confession' ? 'bg-white shadow-sm text-upsa-navy' : 'text-gray-500 hover:text-gray-900'}`}>Confessions</button>
                  <button onClick={() => setTypeFilter("opinion")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'opinion' ? 'bg-white shadow-sm text-upsa-navy' : 'text-gray-500 hover:text-gray-900'}`}>Opinions</button>
                </div>

                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-sm border-gray-200 rounded-lg bg-gray-50 text-gray-700 py-1.5 px-3 outline-none focus:ring-2 focus:ring-upsa-gold/50 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="academics">Academics</option>
                  <option value="campus_life">Campus Life</option>
                  <option value="relationships">Relationships</option>
                  <option value="humor">Humor</option>
                  <option value="serious_support">Serious Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-400">No posts found</h3>
                  <p className="text-sm text-gray-400">Be the first to share something in this category.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map(post => (
                    <ConfessionCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">


              <Card className="border-0 shadow-sm ring-1 ring-gray-100">
                <CardHeader>
                  <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                    <ShieldAlert className="w-5 h-5 text-gray-400" />
                    Our Policy
                  </h3>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-3">
                  <p>All posts are submitted entirely <strong>anonymously</strong>. However, the system detects hate speech, bullying, and severe threats.</p>
                  <p>Posts flagged for severe violations may be removed by the moderation team. True emergencies may be escalated.</p>
                  <Link href="/guidelines" className="text-upsa-navy font-bold hover:underline">Read the full guidelines &rarr;</Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ConfessionCard({ post }: { post: any }) {
  // Client-side reactions state (for immediate UI feedback)
  const [reactions, setReactions] = useState(post.confession_reactions || []);
  
  const getReactionCount = (type: string) => reactions.filter((r: any) => r.reaction_type === type).length;
  // Note: Optimistic update logic for reactions will be handled fully in the dedicated reactions endpoint.
  // We're leaving it read-only here for the MVP slice, but it's trivial to add the fetch to /api/confessions/[id]/react

  return (
    <Card className="border-0 shadow-sm ring-1 ring-gray-100 hover:shadow-md transition-shadow overflow-hidden bg-white">
      <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <Badge variant={post.type === 'confession' ? 'default' : 'secondary'} className={post.type === 'confession' ? "bg-upsa-navy" : "bg-gray-200 text-gray-700"}>
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </Badge>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{post.category.replace('_', ' ')}</span>
        </div>
        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{post.body_text}</p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center text-gray-500">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="hover:bg-blue-50 hover:text-blue-600 rounded-full h-9 px-3 text-xs font-semibold">
            <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> {getReactionCount('relate') || 0} Relate
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600 rounded-full h-9 px-3 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 mr-1.5" /> {getReactionCount('support') || 0} Support
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-amber-50 hover:text-amber-600 rounded-full h-9 px-3 text-xs font-semibold">
            <Laugh className="w-3.5 h-3.5 mr-1.5" /> {getReactionCount('funny') || 0} Funny
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-600 h-8 w-8 rounded-full" title="Report this post">
          <Flag className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
