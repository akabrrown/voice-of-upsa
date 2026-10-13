"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Clock, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function MyConfessionsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/confessions/mine");
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
      toast.error("Failed to load your confessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, []);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50/50 dark:bg-[#060D1A] pt-8 pb-20 transition-colors">
        <div className="container max-w-4xl mx-auto px-4">
          
          <div className="mb-8 space-y-2">
            <Link href="/confessions" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-upsa-navy dark:hover:text-upsa-gold flex items-center mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to feed
            </Link>
            <h1 className="text-3xl font-black text-upsa-navy dark:text-white tracking-tight">My Confessions</h1>
            <p className="text-gray-500 dark:text-gray-400">Track the status of your submitted confessions and opinions.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-gray-300 dark:text-upsa-gold" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#0C1729] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
              <Clock className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">No posts yet</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">You haven't posted any confessions or opinions.</p>
              <Button asChild className="bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy hover:bg-upsa-gold dark:hover:bg-white font-bold">
                <Link href="/confessions/new">Post Anonymously</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <MyConfessionCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function MyConfessionCard({ post }: { post: any }) {
  const getStatusDisplay = () => {
    switch(post.status) {
      case 'published':
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50"><CheckCircle2 className="w-3 h-3 mr-1" /> Published</Badge>;
      case 'pending_review':
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50"><Clock className="w-3 h-3 mr-1" /> Under Review</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case 'removed':
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50"><XCircle className="w-3 h-3 mr-1" /> Removed</Badge>;
      case 'hidden':
        return <Badge variant="outline" className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10"><ShieldAlert className="w-3 h-3 mr-1" /> Hidden (Reported)</Badge>;
      default:
        return <Badge>{post.status}</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-sm ring-1 ring-gray-100 dark:ring-white/10 hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-[#0C1729]">
      <CardHeader className="pb-3 border-b border-gray-50 dark:border-white/5 flex flex-row items-center justify-between bg-gray-50/50 dark:bg-[#060D1A]/50">
        <div className="flex items-center gap-3">
          <Badge variant={post.type === 'confession' ? 'default' : 'secondary'} className={post.type === 'confession' ? "bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy" : "bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300"}>
            {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
          </Badge>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest">{post.category.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-3">
          {getStatusDisplay()}
          <span className="text-xs text-gray-400 dark:text-gray-400">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        <p className={`text-lg leading-relaxed whitespace-pre-wrap ${post.status === 'removed' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
          {post.body_text}
        </p>
        {post.status === 'rejected' && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/50 rounded-xl text-xs text-red-800 dark:text-red-200 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-red-900 dark:text-red-100">
              <ShieldAlert className="w-3.5 h-3.5" /> Moderation Feedback:
            </span>
            <p className="text-red-700 dark:text-red-300 leading-relaxed">
              {post.review_note || "This submission did not meet community guidelines."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
