"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ArticleReactionsProps {
  articleId: string;
}

type ReactionType = "like" | "love" | "insightful" | "wow" | "sad";

interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

const REACTIONS: ReactionConfig[] = [
  { type: "like", emoji: "👍", label: "Like", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { type: "love", emoji: "❤️", label: "Love", color: "bg-red-50 text-red-600 border-red-200" },
  { type: "insightful", emoji: "💡", label: "Insightful", color: "bg-amber-50 text-amber-600 border-amber-200" },
  { type: "wow", emoji: "😮", label: "Wow", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { type: "sad", emoji: "😢", label: "Sad", color: "bg-gray-50 text-gray-600 border-gray-200" },
];

export function ArticleReactions({ articleId }: ArticleReactionsProps) {
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
        <div className="h-2 w-2 bg-upsa-navy rounded-full animate-bounce" />
        <div className="h-2 w-2 bg-upsa-navy rounded-full animate-bounce [animation-delay:0.2s]" />
        <div className="h-2 w-2 bg-upsa-navy rounded-full animate-bounce [animation-delay:0.4s]" />
      </div>
    );
  }

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="py-6 border-t border-b border-gray-100 my-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-upsa-navy uppercase tracking-wider">How do you feel about this article?</h4>
          {totalReactions > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"} so far
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {REACTIONS.map(({ type, emoji, label, color }) => {
            const isSelected = userReaction === type;
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReact(type)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold border transition-all duration-300 ${
                  isSelected
                    ? `${color} border-upsa-gold ring-2 ring-upsa-gold/20 shadow-sm scale-105`
                    : "bg-white hover:bg-gray-50 text-gray-500 border-gray-200"
                }`}
                title={label}
              >
                <span>{emoji}</span>
                <span className="text-xs">{reactionCounts[type] || 0}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {dbError && (
        <div className="mt-3 text-[10px] text-amber-600 bg-amber-50 rounded-lg p-2 text-center border border-amber-100">
          ⚠️ Reactions are running in local mock mode. Please execute the migration SQL in your Supabase SQL editor to enable database saving.
        </div>
      )}
    </div>
  );
}
