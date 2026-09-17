"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Trash2, Reply, CornerDownRight, LogIn } from "lucide-react";

interface CommentProfile {
  full_name: string;
  avatar_url?: string | null;
}

interface DBComment {
  id: string;
  article_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  is_approved: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user?: CommentProfile | null;
}

interface CommentsSectionProps {
  articleId: string;
}

export function CommentsSection({ articleId }: CommentsSectionProps) {
  const [comments, setComments] = useState<DBComment[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>("public");
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const supabase = createClient();

  const fetchComments = useCallback(async () => {
    try {
      // 1. Fetch from comments API
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      const payload = await res.json();
      
      if (payload.success) {
        setComments(payload.data || []);
      } else {
        console.warn("Unable to load comments:", payload.error);
        setComments([]);
      }

      // 2. Fetch logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || "public");
      } else {
        setCurrentUser(null);
        setUserRole("public");
      }
    } catch (err: any) {
      console.error("Error fetching comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePostComment = async (parentId: string | null = null) => {
    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) return;

    if (!currentUser) {
      toast.error("Please login to comment!");
      return;
    }

    setIsPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          parent_id: parentId,
          content: text,
          is_approved: true, // Auto-approve comments for instant active dynamic discussions
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Comment posted successfully!");
        if (parentId) {
          setReplyText("");
          setReplyToId(null);
        } else {
          setNewCommentText("");
        }
        fetchComments();
      } else {
        throw new Error(payload.error);
      }
    } catch (err: any) {
      console.error("Error posting comment:", err);
      toast.error("Failed to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comment deleted.");
      fetchComments();
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment.");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-upsa-navy border-t-transparent" />
        <p className="text-sm text-gray-400 mt-2 font-medium">Loading discussion...</p>
      </div>
    );
  }

  // Build comment hierarchy tree
  const rootComments = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => !!c.parent_id);

  const getRepliesForComment = (parentId: string) => {
    return replies.filter((r) => r.parent_id === parentId);
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const commentDate = new Date(dateStr);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  return (
    <div className="mt-16 bg-white border border-gray-100 rounded-[2rem] shadow-xl p-6 sm:p-10">
      <div className="flex items-center space-x-3 mb-8 border-b pb-6">
        <MessageSquare className="h-7 w-7 text-upsa-navy" />
        <h3 className="text-2xl font-black text-upsa-navy uppercase tracking-tight">
          Discussion ({comments.length})
        </h3>
      </div>

      {/* Write New Comment Form */}
      {currentUser ? (
        <div className="flex gap-4 mb-10">
          <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border border-gray-200">
            <Image
              src={currentUser.user_metadata?.avatar_url || "https://i.pravatar.cc/150?u=current"}
              alt="You"
              fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="What are your thoughts on this story? Share nicely..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="w-full min-h-[100px] rounded-2xl border-gray-200 focus:border-upsa-navy focus:ring-1 focus:ring-upsa-navy/20 p-4 text-sm"
            />
            <div className="flex justify-end">
              <Button
                onClick={() => handlePostComment(null)}
                disabled={isPosting || !newCommentText.trim()}
                className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl px-6 py-2 transition-all duration-300"
              >
                {isPosting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 p-6 bg-gray-50 border border-dashed rounded-3xl text-center space-y-4">
          <p className="text-sm font-bold text-gray-500">You must be logged in to join the discussion.</p>
          <Button asChild className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-2xl px-6 py-5">
            <Link href="/auth/login">
              <LogIn className="h-4 w-4 mr-2" /> Login / Create Account
            </Link>
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {rootComments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm font-medium">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          rootComments.map((comment) => {
            const commentReplies = getRepliesForComment(comment.id);
            const isOwner = currentUser?.id === comment.user_id;
            const isAdmin = userRole === "admin" || userRole === "editor";

            return (
              <div key={comment.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                    <Image
                      src={comment.user?.avatar_url || "https://i.pravatar.cc/150?u=" + comment.id}
                      alt={comment.user?.full_name || "User"}
                      fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Body */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-upsa-navy">
                          {comment.user?.full_name || "Editorial Reader"}
                        </span>
                        <span className="text-xs text-gray-400 ml-2 font-medium">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {currentUser && (
                          <button
                            onClick={() => {
                              setReplyToId(replyToId === comment.id ? null : comment.id);
                              setReplyText("");
                            }}
                            className="p-1.5 text-gray-400 hover:text-upsa-navy rounded-lg hover:bg-gray-50 transition-colors text-xs font-bold flex items-center gap-1"
                            title="Reply to comment"
                          >
                            <Reply className="h-3.5 w-3.5" /> Reply
                          </button>
                        )}
                        {(isOwner || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 leading-relaxed font-light">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {/* Reply Form */}
                {replyToId === comment.id && currentUser && (
                  <div className="flex gap-4 mt-4 ml-14">
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder={`Reply to ${comment.user?.full_name || "Reader"}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full min-h-[80px] rounded-xl border-gray-200 focus:border-upsa-navy p-3 text-sm"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => setReplyToId(null)}
                          className="text-gray-400 hover:text-gray-600 font-bold text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handlePostComment(comment.id)}
                          disabled={isPosting || !replyText.trim()}
                          className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-lg px-4 py-1 text-xs transition-all"
                        >
                          {isPosting ? "Replying..." : "Post Reply"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Replies Nested */}
                {commentReplies.length > 0 && (
                  <div className="mt-4 ml-10 pl-4 border-l-2 border-gray-100 space-y-4">
                    {commentReplies.map((reply) => {
                      const isReplyOwner = currentUser?.id === reply.user_id;
                      return (
                        <div key={reply.id} className="flex gap-3">
                          {/* Corner icon */}
                          <CornerDownRight className="h-4 w-4 text-gray-300 mt-1 shrink-0" />
                          
                          {/* Avatar */}
                          <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0 border border-gray-50">
                            <Image
                              src={reply.user?.avatar_url || "https://i.pravatar.cc/150?u=" + reply.id}
                              alt={reply.user?.full_name || "User"}
                              fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="object-cover"
                            />
                          </div>

                          {/* Body */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-upsa-navy">
                                  {reply.user?.full_name || "Editorial Reader"}
                                </span>
                                <span className="text-[10px] text-gray-400 ml-2 font-medium">
                                  {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>
                              {(isReplyOwner || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 transition-colors"
                                  title="Delete reply"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-light">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
