"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AdDetailModal, type AdRecord } from "./AdDetailModal";
import { Sparkles, Info } from "lucide-react";

interface AdCardWithModalProps {
  ad: AdRecord;
  type: "leaderboard" | "sidebar" | "in-feed";
  className?: string;
}

export function AdCardWithModal({ ad, type, className }: AdCardWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const imageToDisplay = ad.banner_image_url || ad.creative_url;
  if (!imageToDisplay) return null;

  const aspectRatios = {
    leaderboard: "min-h-[50px] aspect-[320/50] md:aspect-[728/90] md:min-h-[90px] w-full max-w-[728px]",
    sidebar: "min-h-[200px] aspect-square md:aspect-[300/250] w-full max-w-[300px]",
    "in-feed": "min-h-[100px] w-full",
  };

  const adLabel = ad.product_name || ad.company_name || "Campus Advertisement";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        aria-label={`View ad details and contact information for ${adLabel}`}
        className={cn(
          "group block w-full text-left overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 relative border border-gray-200/90 dark:border-white/10 bg-gray-100 dark:bg-[#0C1729] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upsa-gold focus-visible:ring-offset-2",
          aspectRatios[type],
          className
        )}
      >
        {/* Ad Tag Badge */}
        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full tracking-wider z-10 flex items-center gap-1.5 shadow-md border border-white/10 group-hover:bg-upsa-navy group-hover:border-upsa-gold/50 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-upsa-gold animate-pulse" />
          <span>Ad · Details</span>
          <Info className="h-2.5 w-2.5 text-upsa-gold opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform" />
        </div>

        {/* Hover Info Overlay Cue */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-3 pointer-events-none">
          <div className="text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow-md">
            <Sparkles className="h-3 w-3 text-upsa-gold" />
            <span className="truncate">Click to view advertiser details & offer</span>
          </div>
        </div>

        {/* Ad Banner Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageToDisplay}
          alt={adLabel}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          loading="lazy"
        />
      </button>

      {/* Detail Popup Modal */}
      <AdDetailModal
        ad={ad}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
