import { cn } from "@/lib/utils";
import { getAdminClient } from "@/lib/supabase/admin";
import { AdCardWithModal } from "./AdCardWithModal";
import { AdFallbackCard } from "./AdFallbackCard";
import { AdCarousel } from "./AdCarousel";
import type { AdRecord } from "./AdDetailModal";

interface AdZoneProps {
  type: "leaderboard" | "sidebar" | "in-feed";
  className?: string;
}

export async function AdZone({ type, className }: AdZoneProps) {
  let activeAds: AdRecord[] = [];

  try {
    const supabase = getAdminClient();

    // Query active advertisements, supporting both ad_placement and legacy ad_type columns
    const { data: ads, error } = await supabase
      .from("advertisements")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && ads && ads.length > 0) {
      activeAds = ads.filter((a: any) => {
        const matchesPlacement = a.ad_placement === type || a.ad_type === type;
        const hasImage = Boolean(
          (a.banner_image_url && a.banner_image_url.trim().length > 0) || 
          (a.creative_url && a.creative_url.trim().length > 0)
        );
        return matchesPlacement && hasImage;
      });
    }
  } catch {
    activeAds = [];
  }

  if (activeAds.length > 0) {
    // Rotating billboard carousel for leaderboard, sidebar, and in-feed placements
    // When 1 ad is active: renders as a static banner with zero overhead.
    // When multiple ads are active (2, 3, 4+): auto-rotates smoothly through all active campaigns.
    return (
      <div 
        className={cn(
          "w-full", 
          type === "leaderboard" && "flex justify-center", 
          type === "sidebar" && "flex justify-center",
          className
        )}
      >
        <AdCarousel ads={activeAds} type={type} />
      </div>
    );
  }

  // Fallback ad placement card with interactive information modal
  return <AdFallbackCard type={type} className={className} />;
}
