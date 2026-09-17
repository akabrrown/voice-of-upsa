"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  articleId: string;
}

export function ViewTracker({ articleId }: ViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch("/api/articles/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleId }),
        });
      } catch (err) {
        console.error("Failed to track view:", err);
      }
    };

    trackView();
  }, [articleId]);

  return null;
}
