"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ArticleReactionsProps {
  articleId: string;
  className?: string;
}

type ReactionType = "like" | "love" | "insightful" | "wow" | "sad";

interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  activeColor: string;
}

const REACTIONS: ReactionConfig[] = [
  { type: "like", emoji: "👍", label: "Like", activeColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-400" },
  { type: "love", emoji: "❤️", label: "Love", activeColor: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-400" },
  { type: "insightful", emoji: "💡", label: "Insightful", activeColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-400" },
  { type: "wow", emoji: "😮", label: "Wow", activeColor: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-400" },
  { type: "sad", emoji: "😢", label: "Sad", activeColor: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-400" },
];

export function ArticleReactions({ articleId, className }: ArticleReactionsProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    insightful: 0,
    wow: 0,
    sad: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  const supabase = createClient();

  const fetchReactions = useCallback(async () => {
    try {
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || null;
      setUserId(currentUserId);

      // 2. Fetch all reactions for this article
      const { data: reactions, error } = await supabase
        .from("article_reactions")
        .select("reaction_type, user_id")
        .eq("article_id", articleId);

      if (error) {
        // If table doesn't exist, activate fallback mock state
        if (error.code === "PGRST116" || error.message.includes("relation") || error.message.includes("does not exist")) {
          setDbError(true);
          console.warn("article_reactions table not found. Using fallback mock state. Please apply migrations.");
        } else {
          throw error;
        }
        return;
      }

      // Calculate counts and user reaction
      const counts: Record<ReactionType, number> = {
        like: 0,
        love: 0,
        insightful: 0,
        wow: 0,
        sad: 0,
      };

      let currentUserReact: ReactionType | null = null;

      reactions?.forEach((r) => {
        const type = r.reaction_type as ReactionType;
        if (counts[type] !== undefined) {
          counts[type]++;
        }
        if (currentUserId && r.user_id === currentUserId) {
          currentUserReact = type;
        }
      });

      setReactionCounts(counts);
      setUserReaction(currentUserReact);
    } catch (error: any) {
      console.error("Error fetching reactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, supabase]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  const handleReact = async (type: ReactionType) => {
    if (!userId) {
      toast.error("Please log in to react to this article!");
      return;
    }

    // Optimistic Update UI
    const previousReaction = userReaction;
    const isRemove = previousReaction === type;
    
    // Calculate new counts optimistically
    const newCounts = { ...reactionCounts };
    if (previousReaction) {
      newCounts[previousReaction] = Math.max(0, newCounts[previousReaction] - 1);
    }
    if (!isRemove) {
      newCounts[type] = (newCounts[type] || 0) + 1;
    }

    setUserReaction(isRemove ? null : type);
    setReactionCounts(newCounts);

    if (dbError) {
      toast.success(isRemove ? "Reaction removed!" : `Reacted with ${type}! (Mock Mode)`);
      return;
    }

    try {
      if (isRemove) {
        // Remove reaction
        const { error } = await supabase
          .from("article_reactions")
          .delete()
          .eq("article_id", articleId)
          .eq("user_id", userId);

        if (error) throw error;
        toast.success("Reaction removed!");
      } else {
        // Upsert reaction
        const { error } = await supabase
          .from("article_reactions")
          .upsert({
            article_id: articleId,
            user_id: userId,
            reaction_type: type,
          }, { onConflict: "article_id,user_id" });

        if (error) throw error;
        toast.success(`Reacted with ${type}!`);
      }
    } catch (error: any) {
      console.error("Error saving reaction:", error);
      toast.error("Failed to save reaction. Reverting...");
      // Revert optimistic update
      setUserReaction(previousReaction);
      fetchReactions();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 py-4 justify-center">
        <div className="h-2 w-2 bg-upsa-navy dark:bg-upsa-gold rounded-full animate-bounce" />
        <div className="h-2 w-2 bg-upsa-navy dark:bg-upsa-gold rounded-full animate-bounce [animation-delay:0.2s]" />
        <div className="h-2 w-2 bg-upsa-navy dark:bg-upsa-gold rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
    );
  }

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className={className || "py-6 border-t border-b border-gray-100 dark:border-white/10 my-8"}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-upsa-navy dark:text-white uppercase tracking-wider">
            How do you feel about this story?
          </h4>
          {totalReactions > 0 ? (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"} so far
            </p>
          ) : (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Be the first to share your thoughts
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Article reactions">
          {REACTIONS.map(({ type, emoji, label, activeColor }) => {
            const isSelected = userReaction === type;
            const count = reactionCounts[type] || 0;
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReact(type)}
                aria-pressed={isSelected}
                aria-label={`${label} reaction (${count} recorded)`}
                className={`min-h-[42px] min-w-[48px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all duration-200 ${
                  isSelected
                    ? `${activeColor} ring-2 ring-upsa-gold/30 shadow-sm scale-105`
                    : "bg-white dark:bg-[#0C1729] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
                }`}
                title={`${label} (${count})`}
              >
                <span className="text-base" aria-hidden="true">{emoji}</span>
                <span>{count}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {dbError && (
        <div className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 text-center border border-amber-200 dark:border-amber-800/40">
          Reactions are running in local preview mode.
        </div>
      )}
    </div>
  );
}
