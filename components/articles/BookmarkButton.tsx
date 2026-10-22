
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

interface BookmarkButtonProps {
  articleId: string;
  initialIsBookmarked?: boolean;
}

export function BookmarkButton({ articleId, initialIsBookmarked = false }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkBookmark = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("bookmarks")
        .select("created_at")
        .eq("profile_id", user.id)
        .eq("article_id", articleId)
        .maybeSingle();

      if (data) {
        setIsBookmarked(true);
      }
    };

    checkBookmark();
  }, [articleId, supabase]);

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please log in to save articles");
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("profile_id", user.id)
          .eq("article_id", articleId);
          
        if (error) throw error;
        setIsBookmarked(false);
        toast.success("Article removed from bookmarks");
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({
            profile_id: user.id,
            article_id: articleId,
          });
          
        if (error) throw error;
        setIsBookmarked(true);
        toast.success("Article saved to bookmarks");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleBookmark}
      disabled={isLoading}
      aria-label={isBookmarked ? "Remove article from saved bookmarks" : "Save article for later reading"}
      aria-pressed={isBookmarked}
      className={`h-10 w-10 rounded-full transition-all duration-200 ${
        isBookmarked 
          ? "text-upsa-gold bg-upsa-gold/10 hover:bg-upsa-gold/20 hover:text-upsa-gold" 
          : "text-slate-600 dark:text-slate-300 hover:text-upsa-gold hover:bg-slate-100 dark:hover:bg-white/10"
      }`}
      title={isBookmarked ? "Remove bookmark" : "Save for later"}
    >
      <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? "fill-current" : ""}`} aria-hidden="true" />
    </Button>
  );
}
