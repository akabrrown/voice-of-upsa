"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const PRESET_REASONS = [
  "Harassment / bullying towards individuals",
  "Hate speech or discriminatory language",
  "Identifies specific students or staff (Doxxing)",
  "Defamation or unverified harmful allegations",
  "Sexually explicit or inappropriate content",
  "Commercial advertising or spam",
  "Safety / self-harm concern",
];

export default function AdminConfessionsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState("pending_review");

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetPost, setTargetPost] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isTakeDown, setIsTakeDown] = useState(false);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/confessions?status=${statusTab}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const sorted = (data.data || []).sort((a: any, b: any) => {
          const aPriority = a.screening_flag === 'self_harm' || a.screening_flag === 'threat' ? 1 : 0;
          const bPriority = b.screening_flag === 'self_harm' || b.screening_flag === 'threat' ? 1 : 0;
          return bPriority - aPriority;
        });
        setPosts(sorted);
      } else {
        toast.error(data.error || "Failed to load confessions");
      }
    } catch {
      toast.error("An error occurred loading confessions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [statusTab]);

  const handleApprove = async (postId: string) => {
    setActioningId(postId);
    try {
      const res = await fetch("/api/admin/confessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, action: 'approve' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Confession approved and published to live feed!");
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else {
        toast.error(data.error || "Failed to approve post");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setActioningId(null);
    }
  };

  const openRejectModal = (post: any, takeDown = false) => {
    setTargetPost(post);
    setIsTakeDown(takeDown);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmRejection = async () => {
    if (!targetPost) return;
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      toast.error("Please provide a reason for the rejection.");
      return;
    }

    setActioningId(targetPost.id);
    try {
      const res = await fetch("/api/admin/confessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          post_id: targetPost.id, 
          action: 'reject', 
          review_note: trimmedReason 
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(isTakeDown ? "Post taken down successfully." : "Submission rejected.");
        setPosts(prev => prev.filter(p => p.id !== targetPost.id));
        setRejectModalOpen(false);
        setTargetPost(null);
        setRejectionReason("");
      } else {
        toast.error(data.error || "Failed to reject submission");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setActioningId(null);
    }
  };

  const handleSelectPreset = (reason: string) => {
    setRejectionReason(prev => {
      if (!prev) return reason;
      if (prev.includes(reason)) return prev;
      return `${prev}; ${reason}`;
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Confessions Moderation</h1>
        <p className="text-muted-foreground dark:text-slate-400">
          Review pending anonymous submissions and manage published posts. Priority items flagged for safety concerns appear first.
        </p>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList className="mb-6 bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/10">
          <TabsTrigger value="pending_review" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#0C1729] dark:data-[state=active]:text-white">Pending Review</TabsTrigger>
          <TabsTrigger value="published" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#0C1729] dark:data-[state=active]:text-white">Published</TabsTrigger>
          <TabsTrigger value="removed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#0C1729] dark:data-[state=active]:text-white">Removed / Rejected</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-300 dark:text-slate-600" />
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-[#0C1729] border-dashed border-gray-200 dark:border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">Queue is empty</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">No confessions found for this status.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => {
              const isPriority = post.screening_flag === 'self_harm' || post.screening_flag === 'threat';
              return (
                <Card key={post.id} className={`bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 ${isPriority ? "border-red-300 dark:border-red-800/60 shadow-md ring-1 ring-red-100 dark:ring-red-950/40" : ""}`}>
                  <CardHeader className={`pb-3 ${isPriority ? "bg-red-50/60 dark:bg-red-950/20" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize font-semibold border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200">{post.type}</Badge>
                        <Badge variant="secondary" className="capitalize bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-slate-200">{post.category?.replace('_', ' ')}</Badge>
                        {isPriority && (
                          <Badge variant="destructive" className="animate-pulse">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            Priority Flag: {post.screening_flag?.replace('_', ' ')}
                          </Badge>
                        )}
                        <Badge className={`border ${
                          post.status === 'published' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/40' : 
                          post.status === 'removed' || post.status === 'rejected' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/40' : 
                          'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/40'
                        }`}>
                          {post.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground dark:text-slate-400 font-mono">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4 space-y-3">
                    <p className="text-gray-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed text-base">{post.body_text}</p>
                    
                    {/* Display Rejection Note if available on removed/rejected tab */}
                    {post.review_note && (
                      <div className="mt-4 p-3.5 bg-red-50/90 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-sm">
                        <div className="flex items-center gap-1.5 font-bold text-red-900 dark:text-red-300 mb-1">
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                          <span>Reason for Rejection / Removal:</span>
                        </div>
                        <p className="text-red-800 dark:text-red-200 font-medium pl-5 leading-relaxed">{post.review_note}</p>
                        {post.reviewed_at && (
                          <p className="text-[11px] text-red-500 dark:text-red-400 font-mono mt-1 pl-5">
                            Moderated {formatDistanceToNow(new Date(post.reviewed_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  {statusTab === 'pending_review' && (
                    <CardFooter className="flex items-center justify-between gap-4 bg-gray-50/60 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 py-3">
                      <span className="text-xs text-gray-500 dark:text-slate-400">Requires moderation before publication</span>
                      <div className="flex items-center gap-2.5">
                        <Button 
                          variant="outline" 
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40"
                          onClick={() => openRejectModal(post)}
                          disabled={actioningId === post.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white font-medium"
                          onClick={() => handleApprove(post.id)}
                          disabled={actioningId === post.id}
                        >
                          {actioningId === post.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                      </div>
                    </CardFooter>
                  )}

                  {statusTab === 'published' && (
                    <CardFooter className="flex items-center justify-between bg-gray-50/60 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 py-3">
                      <span className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" /> Live on feed
                      </span>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => openRejectModal(post, true)}
                        disabled={actioningId === post.id}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />
                        Take Down
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Tabs>

      {/* Rejection / Take Down Modal Dialog */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              {isTakeDown ? "Take Down Published Confession" : "Reject Confession Submission"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-slate-400">
              {isTakeDown 
                ? "Specify the reason for taking down this post. The author will be notified."
                : "Select or type the violation reason. The student will receive this explanation in their notification."}
            </DialogDescription>
          </DialogHeader>

          {targetPost && (
            <div className="space-y-4 py-2">
              {/* Excerpt preview */}
              <div className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs text-gray-700 dark:text-slate-300 max-h-24 overflow-y-auto italic">
                &ldquo;{targetPost.body_text}&rdquo;
              </div>

              {/* Preset quick-select tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-slate-400">
                  Quick-Select Common Violations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="text-xs px-2.5 py-1 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300 flex justify-between">
                  <span>Rejection Reason <span className="text-red-500">*</span></span>
                  <span className="text-[11px] font-normal text-gray-400 dark:text-slate-500">Required</span>
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this submission violates guidelines (e.g. Inappropriate content targeting a student)..."
                  rows={4}
                  className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 text-sm"
                  autoFocus
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5"
              onClick={() => setRejectModalOpen(false)}
              disabled={Boolean(actioningId)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRejection}
              disabled={!rejectionReason.trim() || Boolean(actioningId)}
            >
              {actioningId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isTakeDown ? (
                "Confirm Take Down"
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
