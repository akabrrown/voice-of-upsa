import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

interface AdZoneProps {
  type: "leaderboard" | "sidebar" | "in-feed";
  className?: string;
}

export async function AdZone({ type, className }: AdZoneProps) {
  // Use service role to bypass RLS since public read policy is missing
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ads } = await supabase
    .from("advertisements")
    .select("*")
    .eq("ad_type", type)
    .eq("status", "active")
    .limit(1);

  const ad = ads?.[0];

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

  if (ad) {
    return (
      <Link 
        href={`/ads/${ad.id}`}
        className={cn(
          "block overflow-hidden rounded shadow-sm hover:shadow-md transition-shadow relative",
          aspectRatios[type],
          className
        )}
      >
        <span className="absolute top-1 right-1 bg-black/60 text-[8px] uppercase font-bold text-white px-1.5 py-0.5 rounded tracking-widest z-10">Ad</span>
        <img 
          src={ad.creative_url || ""} 
          alt={ad.company_name} 
          className="w-full h-full object-cover"
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
      <div className="mt-4 text-[10px] text-gray-400 italic">Interested in advertising? <a href="/advertise" className="text-upsa-gold underline">Click here</a></div>
    </div>
  );
}
