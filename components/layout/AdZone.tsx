import { cn } from "@/lib/utils";
import { getAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

interface AdZoneProps {
  type: "leaderboard" | "sidebar" | "in-feed";
  className?: string;
}

export async function AdZone({ type, className }: AdZoneProps) {
  let ad: any = null;

  try {
    const supabase = getAdminClient();
    const { data: ads } = await supabase
      .from("advertisements")
      .select("*")
      .eq("ad_type", type)
      .eq("status", "active")
      .not("creative_url", "is", null)
      .neq("creative_url", "")
      .limit(1);

    ad = ads?.[0] || null;
  } catch (err) {
    // Graceful fallback to default banner placeholder during build time or missing credentials
    ad = null;
  }

  const dimensions = {
    leaderboard: "728 x 90",
    sidebar: "300 x 250",
    "in-feed": "Native Ad Unit",
  };

  const aspectRatios = {
    leaderboard: "aspect-[728/90]",
    sidebar: "aspect-[300/250]",
    "in-feed": "aspect-video",
  };

  if (ad && typeof ad.creative_url === "string" && ad.creative_url.trim().length > 0) {
    return (
      <Link 
        href={`/ads/${ad.id}`}
        className={cn(
          "block overflow-hidden rounded shadow-sm hover:shadow-md transition-shadow relative group",
          aspectRatios[type],
          className
        )}
      >
        <span className="absolute top-1 right-1 bg-black/60 text-[8px] uppercase font-bold text-white px-1.5 py-0.5 rounded tracking-widest z-10">Ad</span>
        <img 
          src={ad.creative_url} 
          alt={ad.company_name || ad.product_name || "Advertisement"} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
    );
  }

  return (
    <div className={cn(
      "bg-gray-100 border border-dashed border-gray-300 rounded flex flex-col items-center justify-center overflow-hidden",
      aspectRatios[type],
      className
    )}>
      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Advertisement</span>
      <span className="text-xs font-medium text-gray-500">{dimensions[type]}</span>
      <div className="mt-4 text-[10px] text-gray-400 italic">Interested in advertising? <Link href="/advertise" className="text-upsa-gold underline">Click here</Link></div>
    </div>
  );
}
