"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminConfessionsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [statusTab, setStatusTab] = useState("pending_review");

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/confessions?status=${statusTab}`);
      const data = await res.json();
      if (data.success) {
        const sorted = data.data.sort((a: any, b: any) => {
          const aPriority = a.screening_flag === 'self_harm' || a.screening_flag === 'threat' ? 1 : 0;
          const bPriority = b.screening_flag === 'self_harm' || b.screening_flag === 'threat' ? 1 : 0;
          return bPriority - aPriority;
        });
        setPosts(sorted);
      } else {
        toast.error(data.error || "Failed to load confessions");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusTab]);

  const handleAction = async (postId: string, action: 'approve' | 'reject') => {
    const note = reviewNotes[postId] || "";
    if (action === 'reject' && !note.trim()) {
      toast.error("A review note is required to reject a post.");
      return;
    }

    setActioningId(postId);
    try {
      const res = await fetch("/api/admin/confessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, action, review_note: note }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Post ${action}d successfully`);
        setPosts(prev => prev.filter(p => p.id !== postId));
        setReviewNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[postId];
          return newNotes;
        });
      } else {
        toast.error(data.error || `Failed to ${action} post`);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Confessions Moderation</h1>
        <p className="text-muted-foreground">
          Review pending anonymous submissions and manage published posts. Priority items flagged for safety concerns appear first.
        </p>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList className="mb-6 bg-gray-100">
          <TabsTrigger value="pending_review" className="data-[state=active]:bg-white">Pending Review</TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-white">Published</TabsTrigger>
          <TabsTrigger value="removed" className="data-[state=active]:bg-white">Removed</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900">Queue is empty</p>
              <p className="text-sm text-gray-500">No confessions found for this status.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => {
              const isPriority = post.screening_flag === 'self_harm' || post.screening_flag === 'threat';
              return (
                <Card key={post.id} className={isPriority ? "border-red-200 shadow-sm" : ""}>
                  <CardHeader className={`pb-3 ${isPriority ? "bg-red-50/50" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize">{post.type}</Badge>
                        <Badge variant="secondary" className="capitalize">{post.category.replace('_', ' ')}</Badge>
                        {isPriority && (
                          <Badge variant="destructive" className="animate-pulse">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            Priority Flag: {post.screening_flag.replace('_', ' ')}
                          </Badge>
                        )}
                        <Badge className={
                          post.status === 'published' ? 'bg-green-100 text-green-800' : 
                          post.status === 'removed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }>
                          {post.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{post.body_text}</p>
                  </CardContent>
                  
                  {statusTab === 'pending_review' && (
                    <CardFooter className="flex-col items-stretch gap-4 bg-gray-50/50 border-t pt-4">
                      <Textarea 
                        placeholder="Add a review note (required for rejections)..."
                        value={reviewNotes[post.id] || ""}
                        onChange={(e) => setReviewNotes(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="h-20 bg-white"
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleAction(post.id, 'reject')}
                          disabled={actioningId === post.id}
                        >
                          {actioningId === post.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                          Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction(post.id, 'approve')}
                          disabled={actioningId === post.id}
                        >
                          {actioningId === post.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                          Approve
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                  {statusTab === 'published' && (
                    <CardFooter className="flex-col items-stretch gap-4 bg-gray-50/50 border-t pt-4">
                      <Textarea 
                        placeholder="Add a reason for removal..."
                        value={reviewNotes[post.id] || ""}
                        onChange={(e) => setReviewNotes(prev => ({ ...prev, [post.id]: e.target.value }))}
                        className="h-20 bg-white"
                      />
                      <div className="flex justify-end">
                        <Button 
                          variant="destructive"
                          onClick={() => handleAction(post.id, 'reject')}
                          disabled={actioningId === post.id}
                        >
                          {actioningId === post.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                          Take Down
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Tabs>
    </div>
  );
}
