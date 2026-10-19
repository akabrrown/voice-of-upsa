"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import {
  MessageSquare,
  Trash2,
  Reply,
  CornerDownRight,
  User,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Lock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { UserAvatar, getInitials } from "@/components/ui/user-avatar";
import {
  getStoredGuestProfile,
  getOrCreateDeviceId,
  lockGuestProfile,
  generateGuestDiscriminator,
  getGuestAvatarColor,
  isReservedName,
  GuestProfile,
} from "@/lib/comments/guest-identity";

interface CommentProfile {
  full_name: string;
  avatar_url?: string | null;
  role?: string;
  badge?: string | null;
  avatar_color?: string;
  is_guest?: boolean;
}

interface DBComment {
  id: string;
  article_id: string;
  user_id: string | null;
  parent_id?: string | null;
  content: string;
  is_approved: boolean;
  is_deleted: boolean;
  is_guest?: boolean;
  guest_id?: string | null;
  guest_badge?: string | null;
  created_at: string;
  updated_at: string;
  user?: CommentProfile | null;
}

interface CommentsSectionProps {
  articleId: string;
  allowComments?: boolean;
}

export function CommentsSection({ articleId, allowComments = true }: CommentsSectionProps) {
  const [comments, setComments] = useState<DBComment[]>([]);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>("public");
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Guest Identity & Device Locking State
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [isEditingGuestName, setIsEditingGuestName] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");

  const supabase = createClient();

  // Initialize offline listener, device ID and persistent guest profile on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
      const onOnline = () => setIsOffline(false);
      const onOffline = () => setIsOffline(true);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      return () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }
  }, []);

  useEffect(() => {
    const devId = getOrCreateDeviceId();
    setDeviceId(devId);

    const stored = getStoredGuestProfile();
    if (stored) {
      setGuestProfile(stored);
      setGuestNameInput(stored.guestName);
    }
  }, []);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      const payload = await res.json();

      if (payload.success) {
        setComments(payload.data || []);
      } else {
        console.warn("Unable to load comments:", payload.error);
        setFetchError(payload.error || "Failed to load discussion.");
        setComments([]);
      }

      // Check logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      setFetchError(err.message || "Network error loading comments.");
    } finally {
      setIsLoading(false);
    }
  }, [articleId, supabase]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle updating locked guest display name
  const handleSaveGuestName = () => {
    const trimmed = guestNameInput.trim();
    if (!trimmed || trimmed.length < 2) {
      toast.error("Display name must be at least 2 characters long.");
      return;
    }

    if (isReservedName(trimmed)) {
      toast.error("This name is reserved for official staff and editors.");
      return;
    }

    try {
      const updated = lockGuestProfile(trimmed);
      setGuestProfile(updated);
      setIsEditingGuestName(false);
      toast.success(`Identity updated: ${updated.guestName} (${updated.guestBadge})`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save name.");
    }
  };

  const handlePostComment = async (parentId: string | null = null) => {
    if (isOffline) {
      toast.error("You are currently offline. Please reconnect to post.");
      return;
    }

    if (!allowComments) {
      toast.error("Comments are closed for this story.");
      return;
    }

    const text = parentId ? replyText : newCommentText;
    if (!text.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }

    let authorName: string | undefined = undefined;
    let effectiveGuestId: string | undefined = undefined;

    // For non-registered visitors, ensure they have a locked identity
    if (!currentUser) {
      let currentGuest = guestProfile;

      if (!currentGuest) {
        const trimmed = guestNameInput.trim();
        if (!trimmed || trimmed.length < 2) {
          toast.error("Please provide your name to join the discussion.");
          return;
        }

        if (isReservedName(trimmed)) {
          toast.error("This name is reserved for official staff and editors.");
          return;
        }

        try {
          currentGuest = lockGuestProfile(trimmed);
          setGuestProfile(currentGuest);
        } catch (err: any) {
          toast.error(err.message || "Invalid display name.");
          return;
        }
      }

      authorName = currentGuest.guestName;
      effectiveGuestId = currentGuest.guestId;
    }

    setIsPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          parent_id: parentId,
          content: text.trim(),
          author_name: authorName,
          guest_id: effectiveGuestId,
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
      toast.error(err.message || "Failed to post comment.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment_id: commentId,
          guest_id: deviceId || guestProfile?.guestId,
        }),
      });

      const payload = await res.json();
      if (payload.success) {
        toast.success("Comment deleted.");
        fetchComments();
      } else {
        throw new Error(payload.error);
      }
    } catch (err: any) {
      console.error("Error deleting comment:", err);
      toast.error(err.message || "Failed to delete comment.");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-upsa-navy dark:border-upsa-gold border-t-transparent" />
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 font-medium">
          Loading discussion...
        </p>
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

  const previewDiscriminator = deviceId ? generateGuestDiscriminator(deviceId) : "#0001";
  const previewColor = deviceId ? getGuestAvatarColor(deviceId) : null;

  return (
    <div className="mt-16 bg-white dark:bg-[#0C1729] border border-gray-100 dark:border-white/10 rounded-[2rem] shadow-xl dark:shadow-2xl p-6 sm:p-10 transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-white/10 pb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-upsa-navy/5 dark:bg-upsa-gold/10 text-upsa-navy dark:text-upsa-gold">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-black text-upsa-navy dark:text-white uppercase tracking-tight">
            Discussion ({comments.length})
          </h3>
        </div>
        {!currentUser && (
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-upsa-navy/70 dark:text-gray-400 hover:text-upsa-navy dark:hover:text-upsa-gold transition-colors"
          >
            Sign in for verified badge <Sparkles className="h-3 w-3 text-upsa-gold" />
          </Link>
        )}
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>You are currently offline. New comments will fail until network is restored.</span>
        </div>
      )}

      {/* Fetch Error with Retry */}
      {fetchError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{fetchError}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchComments}
            className="h-8 text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Comment Input Area or Comments Closed Notice */}
      {!allowComments ? (
        <div className="mb-10 p-6 rounded-2xl bg-slate-50 dark:bg-[#080F1E] border border-gray-200/80 dark:border-white/10 text-center">
          <div className="inline-flex p-3 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-slate-400 mb-2">
            <Lock className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-upsa-navy dark:text-white">Discussion Closed</h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Comments and responses have been disabled for this story by the editorial team.
          </p>
        </div>
      ) : (
        <div className="mb-10">
        {currentUser ? (
          /* Case A: Authenticated Member */
          <div className="flex gap-4">
            <UserAvatar
              src={currentUser.user_metadata?.avatar_url}
              name={currentUser.user_metadata?.full_name || "You"}
              size="md"
              className="border border-gray-200 dark:border-white/10 shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-upsa-navy dark:text-white">
                  {currentUser.user_metadata?.full_name || "You"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-upsa-navy text-white dark:bg-upsa-gold dark:text-upsa-navy">
                  {userRole}
                </span>
              </div>
              <Textarea
                placeholder="What are your thoughts on this story? Share your perspective..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full min-h-[100px] rounded-2xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#080F1E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-upsa-navy dark:focus:border-upsa-gold focus:ring-1 focus:ring-upsa-navy/20 dark:focus:ring-upsa-gold/20 p-4 text-sm"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => handlePostComment(null)}
                  disabled={isPosting || !newCommentText.trim()}
                  className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-white font-bold rounded-xl px-6 py-2 transition-all duration-300 shadow-sm"
                >
                  {isPosting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Case B: Non-registered Visitor (Device Locked with Discriminator) */
          <div className="bg-slate-50/70 dark:bg-[#080F1E] border border-gray-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 space-y-4">
            {/* Identity Bar */}
            {guestProfile && !isEditingGuestName ? (
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200/60 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ${guestProfile.avatarColor}`}
                  >
                    {getInitials(guestProfile.guestName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Commenting as</span>
                      <span className="text-sm font-bold text-upsa-navy dark:text-white">
                        {guestProfile.guestName}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        title="Your device-unique ID so identical names are always distinguishable"
                      >
                        {guestProfile.guestBadge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                      <Lock className="h-3 w-3 text-emerald-600 dark:text-emerald-400 inline" /> Device locked
                      (recognized automatically on return)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingGuestName(true);
                    setGuestNameInput(guestProfile.guestName);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-upsa-navy dark:text-gray-400 dark:hover:text-upsa-gold px-2.5 py-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit Name
                </button>
              </div>
            ) : (
              /* First time or editing name */
              <div className="space-y-3 pb-3 border-b border-gray-200/60 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-upsa-navy dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                    <User className="h-3.5 w-3.5 text-upsa-gold" />
                    {guestProfile ? "Update Your Display Name" : "Enter Your Display Name"}
                  </label>
                  {previewColor && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                      Your Discriminator:{" "}
                      <strong className="text-amber-600 dark:text-amber-400">
                        {previewDiscriminator}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="e.g., Kofi Mensah or Akua"
                      maxLength={50}
                      value={guestNameInput}
                      onChange={(e) => setGuestNameInput(e.target.value)}
                      className="rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#060D1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm h-10 px-3"
                    />
                  </div>
                  {guestProfile && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveGuestName}
                        className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy font-bold rounded-xl h-10 px-4 text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingGuestName(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl h-10 px-3 text-xs"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-upsa-gold shrink-0 inline" />
                  No sign-up required. Your device is saved with a unique tag (e.g.{" "}
                  <code className="text-amber-600 dark:text-amber-400 font-mono">
                    {previewDiscriminator}
                  </code>
                  ) so you won&apos;t have to type your name again.
                </p>
              </div>
            )}

            {/* Comment Textarea */}
            <div className="space-y-3">
              <Textarea
                placeholder="What are your thoughts on this story? Share your perspective..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full min-h-[90px] rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#060D1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-upsa-navy dark:focus:border-upsa-gold p-3.5 text-sm"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  Respect campus community guidelines. Keep discussions polite and constructive.
                </span>
                <Button
                  onClick={() => handlePostComment(null)}
                  disabled={
                    isPosting ||
                    !newCommentText.trim() ||
                    (!guestProfile && !guestNameInput.trim())
                  }
                  className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-white font-bold rounded-xl px-6 py-2 transition-all duration-300 shadow-sm"
                >
                  {isPosting ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {rootComments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm font-medium">
            No comments yet. Be the first to start the conversation!
          </div>
        ) : (
          rootComments.map((comment) => {
            const commentReplies = getRepliesForComment(comment.id);
            const isOwner =
              (currentUser && currentUser.id === comment.user_id) ||
              (!comment.user_id &&
                comment.guest_id &&
                deviceId &&
                comment.guest_id === deviceId);
            const isAdmin = userRole === "admin" || userRole === "editor";
            const isGuest = comment.is_guest || !comment.user_id;

            return (
              <div
                key={comment.id}
                className="border-b border-gray-100 dark:border-white/5 pb-6 last:border-0 last:pb-0"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  {isGuest ? (
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0 ${
                        comment.user?.avatar_color || "bg-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy"
                      }`}
                    >
                      {getInitials(comment.user?.full_name || "Guest Reader")}
                    </div>
                  ) : (
                    <UserAvatar
                      src={comment.user?.avatar_url}
                      name={comment.user?.full_name || "Editorial Reader"}
                      size="md"
                      className="border border-gray-100 dark:border-white/10 shrink-0"
                    />
                  )}

                  {/* Body */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-upsa-navy dark:text-white">
                          {comment.user?.full_name || "Editorial Reader"}
                        </span>

                        {/* Badges */}
                        {isGuest && comment.guest_badge && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            title="Unique device discriminator"
                          >
                            {comment.guest_badge}
                          </span>
                        )}

                        {!isGuest && comment.user?.role && ["admin", "editor"].includes(comment.user.role) && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-upsa-navy text-white dark:bg-upsa-gold dark:text-upsa-navy">
                            {comment.user.role}
                          </span>
                        )}

                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setReplyToId(replyToId === comment.id ? null : comment.id);
                            setReplyText("");
                          }}
                          className="p-1.5 text-gray-400 hover:text-upsa-navy dark:text-gray-400 dark:hover:text-upsa-gold rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-xs font-bold flex items-center gap-1"
                          title="Reply to comment"
                        >
                          <Reply className="h-3.5 w-3.5" /> Reply
                        </button>

                        {(isOwner || isAdmin) && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed font-normal">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {/* Reply Form */}
                {replyToId === comment.id && (
                  <div className="flex gap-4 mt-4 ml-6 sm:ml-14">
                    <div className="flex-1 space-y-3 bg-slate-50/70 dark:bg-[#080F1E] p-4 rounded-xl border border-gray-200/80 dark:border-white/10">
                      {!currentUser && !guestProfile && (
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-upsa-navy dark:text-white uppercase tracking-wider">
                            Your Display Name
                          </label>
                          <Input
                            type="text"
                            placeholder="e.g., Kofi Mensah"
                            value={guestNameInput}
                            onChange={(e) => setGuestNameInput(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-[#060D1A] rounded-lg border-gray-200 dark:border-white/10"
                          />
                        </div>
                      )}
                      <Textarea
                        placeholder={`Reply to ${comment.user?.full_name || "Reader"}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="w-full min-h-[75px] rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-[#060D1A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-upsa-navy dark:focus:border-upsa-gold p-3 text-xs"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          onClick={() => setReplyToId(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-bold text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handlePostComment(comment.id)}
                          disabled={isPosting || !replyText.trim()}
                          className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-white font-bold rounded-lg px-4 py-1 text-xs transition-all"
                        >
                          {isPosting ? "Replying..." : "Post Reply"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Replies Nested */}
                {commentReplies.length > 0 && (
                  <div className="mt-4 ml-6 sm:ml-12 pl-4 border-l-2 border-gray-100 dark:border-white/10 space-y-4">
                    {commentReplies.map((reply) => {
                      const isReplyOwner =
                        (currentUser && currentUser.id === reply.user_id) ||
                        (!reply.user_id &&
                          reply.guest_id &&
                          deviceId &&
                          reply.guest_id === deviceId);
                      const isReplyGuest = reply.is_guest || !reply.user_id;

                      return (
                        <div key={reply.id} className="flex gap-3">
                          <CornerDownRight className="h-4 w-4 text-gray-300 dark:text-gray-600 mt-1 shrink-0" />

                          {isReplyGuest ? (
                            <div
                              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-sm shrink-0 ${
                                reply.user?.avatar_color || "bg-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy"
                              }`}
                            >
                              {getInitials(reply.user?.full_name || "Guest")}
                            </div>
                          ) : (
                            <UserAvatar
                              src={reply.user?.avatar_url}
                              name={reply.user?.full_name || "Editorial Reader"}
                              size="sm"
                              className="border border-gray-50 dark:border-white/10 shrink-0"
                            />
                          )}

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-upsa-navy dark:text-white">
                                  {reply.user?.full_name || "Editorial Reader"}
                                </span>

                                {isReplyGuest && reply.guest_badge && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {reply.guest_badge}
                                  </span>
                                )}

                                {!isReplyGuest && reply.user?.role && ["admin", "editor"].includes(reply.user.role) && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-upsa-navy text-white dark:bg-upsa-gold dark:text-upsa-navy">
                                    {reply.user.role}
                                  </span>
                                )}

                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                  {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>

                              {(isReplyOwner || isAdmin) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                  title="Delete reply"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-normal">
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
