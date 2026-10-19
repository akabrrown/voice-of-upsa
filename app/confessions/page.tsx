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
import { ReportModal } from "@/components/common/ReportModal";

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
      
      const res = await fetch(url.toString(), { cache: 'no-store' });
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
      <main className="min-h-screen bg-gray-50/50 dark:bg-[#060D1A] pt-8 pb-20 transition-colors duration-300">
        <div className="container max-w-4xl mx-auto px-4">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-black text-upsa-navy dark:text-white tracking-tight mb-2">Campus Confessions</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-lg">The anonymous heartbeat of UPSA. Share your truth, opinions, and experiences safely.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button asChild variant="outline" className="border-gray-200 dark:border-white/10 text-upsa-navy dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5">
                <Link href="/confessions/mine">My Confessions</Link>
              </Button>
              <Button asChild className="bg-upsa-navy hover:bg-upsa-navy/90 text-white dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-white font-bold transition-colors">
                <Link href="/confessions/new"><Plus className="w-4 h-4 mr-2" /> Post Anonymously</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-[#0C1729] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 mr-2">
                  <Filter className="w-4 h-4" /> Filter by:
                </div>
                
                <div className="flex gap-2 bg-gray-100 dark:bg-[#060D1A] p-1 rounded-lg">
                  <button onClick={() => setTypeFilter("all")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-[#0C1729] shadow-sm text-upsa-navy dark:text-upsa-gold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>All</button>
                  <button onClick={() => setTypeFilter("confession")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'confession' ? 'bg-white dark:bg-[#0C1729] shadow-sm text-upsa-navy dark:text-upsa-gold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Confessions</button>
                  <button onClick={() => setTypeFilter("opinion")} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${typeFilter === 'opinion' ? 'bg-white dark:bg-[#0C1729] shadow-sm text-upsa-navy dark:text-upsa-gold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Opinions</button>
                </div>

                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-sm border-gray-200 dark:border-white/10 rounded-lg bg-gray-50 dark:bg-[#060D1A] text-gray-700 dark:text-gray-200 py-1.5 px-3 outline-none focus:ring-2 focus:ring-upsa-gold/50 cursor-pointer"
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
                  <Loader2 className="w-8 h-8 animate-spin text-gray-300 dark:text-gray-600" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-[#0C1729] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                  <MessageSquare className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">No posts found</h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Be the first to share something in this category.</p>
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
              <Card className="border-0 shadow-sm ring-1 ring-gray-100 dark:ring-white/10 bg-white dark:bg-[#0C1729]">
                <CardHeader>
                  <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                    <ShieldAlert className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    Our Policy
                  </h3>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
                  <p>All posts are submitted entirely <strong>anonymously</strong>. However, the system detects hate speech, bullying, and severe threats.</p>
                  <p>Posts flagged for severe violations may be removed by the moderation team. True emergencies may be escalated.</p>
                  <Link href="/guidelines" className="text-upsa-navy dark:text-upsa-gold font-bold hover:underline">Read the full guidelines &rarr;</Link>
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
  const [reactions, setReactions] = useState<any[]>(post.confession_reactions || []);
  const [isReacting, setIsReacting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);

  const getReactionCount = (type: string) => reactions.filter((r: any) => r.reaction_type === type).length;

  const handleReaction = async (reactionType: "relate" | "support" | "funny") => {
    if (isReacting) return;
    setIsReacting(true);

    try {
      const res = await fetch(`/api/confessions/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction_type: reactionType }),
      });

      if (res.status === 401) {
        toast.info("Please sign in to react to confessions.", {
          action: {
            label: "Sign In",
            onClick: () => {
              window.location.href = `/auth/login?next=/confessions`;
            },
          },
        });
        return;
      }

      const data = await res.json();
      if (data.success && data.reactions) {
        setReactions(data.reactions);
      } else {
        toast.error(data.error || "Failed to update reaction");
      }
    } catch {
      toast.error("Could not record reaction. Please check your connection.");
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <>
      <Card className="border-0 shadow-sm ring-1 ring-gray-100 dark:ring-white/10 hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-[#0C1729]">
        <CardHeader className="pb-3 border-b border-gray-50 dark:border-white/5 flex flex-row items-center justify-between bg-gray-50/50 dark:bg-[#080F1E]/50">
          <div className="flex items-center gap-3">
            <Badge variant={post.type === 'confession' ? 'default' : 'secondary'} className={post.type === 'confession' ? "bg-upsa-navy text-white dark:bg-upsa-gold dark:text-upsa-navy font-bold" : "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300"}>
              {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
            </Badge>
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{post.category.replace('_', ' ')}</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <p className="text-gray-800 dark:text-slate-200 text-lg leading-relaxed whitespace-pre-wrap">{post.body_text}</p>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between items-center text-gray-500 dark:text-gray-400">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={isReacting}
              onClick={() => handleReaction('relate')}
              className="hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300 rounded-full h-9 px-3 text-xs font-semibold"
            >
              <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> {getReactionCount('relate')} Relate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isReacting}
              onClick={() => handleReaction('support')}
              className="hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 text-gray-600 dark:text-gray-300 rounded-full h-9 px-3 text-xs font-semibold"
            >
              <Heart className="w-3.5 h-3.5 mr-1.5" /> {getReactionCount('support')} Support
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isReacting}
              onClick={() => handleReaction('funny')}
              className="hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 text-gray-600 dark:text-gray-300 rounded-full h-9 px-3 text-xs font-semibold"
            >
              <Laugh className="w-3.5 h-3.5 mr-1.5" /> {getReactionCount('funny')} Funny
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsReportOpen(true)}
            className={`h-8 w-8 rounded-full ${isReported ? 'text-red-500' : 'hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 text-gray-400 dark:text-gray-500'}`}
            title={isReported ? "Reported" : "Report this post"}
            disabled={isReported}
          >
            <Flag className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        resourceType="confession"
        resourceId={post.id}
        resourceTitle={`Confession #${post.id.slice(0, 6)}`}
        onSuccess={() => setIsReported(true)}
      />
    </>
  );
}
