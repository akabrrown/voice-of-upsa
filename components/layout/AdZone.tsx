import { cn } from "@/lib/utils";
import { getAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Star, TrendingUp, Megaphone, ShieldCheck } from "lucide-react";

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
  } catch {
    ad = null;
  }

  if (ad && typeof ad.creative_url === "string" && ad.creative_url.trim().length > 0) {
    const aspectRatios = {
      leaderboard: "aspect-[728/90] md:h-[90px] w-full max-w-[728px]",
      sidebar: "aspect-[300/250] w-full max-w-[300px]",
      "in-feed": "w-full",
    };

    return (
      <Link 
        href={`/ads/${ad.id}`}
        className={cn(
          "block overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 relative group border border-gray-200/80 dark:border-gray-800",
          aspectRatios[type],
          className
        )}
      >
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full tracking-wider z-10 flex items-center gap-1">
          <span>Ad</span>
          <ArrowUpRight className="h-2.5 w-2.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
        <img 
          src={ad.creative_url} 
          alt={ad.company_name || ad.product_name || "Advertisement"} 
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </Link>
    );
  }

  if (type === "leaderboard") {
    return (
      <Link
        href="/advertise"
        className={cn(
          "group block w-full max-w-[820px] mx-auto overflow-hidden bg-gray-50 border border-gray-200 hover:border-upsa-gold transition-colors duration-200",
          className
        )}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:px-6 md:py-4 h-full min-h-[90px]">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 bg-upsa-navy items-center justify-center text-white">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-upsa-navy flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3" /> Voice of UPSA Media
                </span>
                <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-sm font-semibold">
                  25k+ Reach
                </span>
              </div>
              <h4 className="text-slate-900 text-sm md:text-base font-bold tracking-tight group-hover:text-upsa-gold transition-colors">
                Amplify Your Brand Across UPSA Campus
              </h4>
            </div>
          </div>
          
          <div className="shrink-0 mt-3 sm:mt-0">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-upsa-navy text-white text-xs font-bold hover:bg-upsa-gold hover:text-upsa-navy transition-colors">
              <span>Advertise Here</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (type === "sidebar") {
    return (
      <Link
        href="/advertise"
        className={cn(
          "group block w-full max-w-[300px] mx-auto overflow-hidden bg-white border border-gray-200 hover:border-upsa-navy transition-colors duration-200",
          className
        )}
      >
        <div className="relative h-[250px] w-full flex flex-col justify-between p-5 bg-gray-50">
          <div className="flex justify-between items-start">
            <span className="inline-flex items-center gap-1 bg-upsa-navy text-[9px] uppercase font-bold text-white px-2 py-1">
              <Star className="h-2.5 w-2.5 text-upsa-gold" /> Featured Spot
            </span>
          </div>

          <div className="mt-auto">
            <h4 className="text-slate-900 font-black text-lg tracking-tight leading-tight group-hover:text-upsa-gold transition-colors">
              Connect With 25,000+ Students & Faculty
            </h4>
            <p className="text-gray-600 text-xs mt-2 leading-relaxed font-medium">
              High-visibility placements & editorial spotlights.
            </p>

            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">Tiers From</span>
                <span className="text-sm font-black text-slate-900">GH₵ 250 / wk</span>
              </div>
              <div className="inline-flex items-center gap-1 text-upsa-navy text-xs font-bold group-hover:text-upsa-gold transition-colors">
                <span>Book</span>
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/advertise"
      className={cn(
        "group block w-full overflow-hidden bg-upsa-navy border border-upsa-navy hover:bg-[#001f40] transition-colors duration-200",
        className
      )}
    >
      <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 bg-white/10 flex items-center justify-center text-upsa-gold">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-upsa-gold flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Official Campus Advertising
              </span>
            </div>
            <h4 className="text-white text-base md:text-lg font-bold tracking-tight">
              Put Your Business Front & Center
            </h4>
            <p className="text-gray-300 text-xs md:text-sm mt-1 max-w-xl">
              Target campus customers with native feed placements and customized editorial features.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end md:self-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-upsa-gold text-upsa-navy text-xs md:text-sm font-bold hover:bg-white transition-colors">
            <span>Explore Packages</span>
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
