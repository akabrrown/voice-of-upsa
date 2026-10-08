"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  articleId: string;
  slug: string;
}

export function ViewTracker({ articleId, slug }: ViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        // Legacy view tracker
        await fetch("/api/articles/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleId }),
        });

        // New global site_metrics tracker
        await fetch("/api/metrics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_type: "article",
            entity_slug: slug,
            metric_type: "view"
          })
        });
      } catch (err) {
        console.error("Failed to track view:", err);
      }
    };

    trackView();
  }, [articleId, slug]);

  return null;
}
