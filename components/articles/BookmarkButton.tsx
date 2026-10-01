
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { toast } from "react-hot-toast";

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
      className={`transition-colors ${isBookmarked ? "text-upsa-gold hover:text-upsa-navy" : "text-gray-400 hover:text-upsa-gold"}`}
      title={isBookmarked ? "Remove bookmark" : "Save for later"}
    >
      <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
    </Button>
  );
}
