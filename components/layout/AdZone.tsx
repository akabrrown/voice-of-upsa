import { cn } from "@/lib/utils";
import { getAdminClient } from "@/lib/supabase/admin";
import { AdCardWithModal } from "./AdCardWithModal";
import { AdFallbackCard } from "./AdFallbackCard";
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
      .eq("status", "active");

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
    // Placement limits
    const limits = {
      leaderboard: 1, // 1 leaderboard banner at the top
      sidebar: 3,     // Up to 3 stacked sidebar ads
      "in-feed": 1,   // 1 in-feed ad per placement
    };

    const adsToShow = activeAds.slice(0, limits[type]);

    return (
      <div 
        className={cn(
          "flex flex-col gap-6 w-full", 
          type === "leaderboard" && "items-center", 
          className
        )}
      >
        {adsToShow.map((ad, idx) => (
          <AdCardWithModal
            key={ad.id || idx}
            ad={ad}
            type={type}
          />
        ))}
      </div>
    );
  }

  // Fallback ad placement card with interactive information modal
  return <AdFallbackCard type={type} className={className} />;
}
