"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AdDetailModal, type AdRecord } from "./AdDetailModal";
import { AdCardWithModal } from "./AdCardWithModal";
import { ChevronLeft, ChevronRight, Info, Sparkles, Pause, Play } from "lucide-react";

interface AdLeaderboardCarouselProps {
  ads: AdRecord[];
  className?: string;
}

export function AdLeaderboardCarousel({ ads, className }: AdLeaderboardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedModalAd, setSelectedModalAd] = useState<AdRecord | null>(null);

  // If there are no ads, return null
  if (!ads || ads.length === 0) {
    return null;
  }

  // If there's only 1 ad, render the standard single banner without carousel overhead
  if (ads.length === 1) {
    return <AdCardWithModal ad={ads[0]} type="leaderboard" className={className} />;
  }

  // Safe index within bounds
  const activeIndex = currentIndex >= ads.length ? 0 : currentIndex;
  const currentAd = ads[activeIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  // Auto-advance every 6 seconds unless hovered or modal open
  useEffect(() => {
    if (isPaused || selectedModalAd !== null) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [ads.length, isPaused, selectedModalAd]);

  const adLabel = currentAd?.product_name || currentAd?.company_name || "Campus Advertisement";
  const imageToDisplay = currentAd?.banner_image_url || currentAd?.creative_url || currentAd?.featured_image || currentAd?.image_url;

  return (
    <>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Campus Advertisements Banner"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className={cn(
          "group relative w-full max-w-[728px] overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/90 dark:border-white/10 bg-gray-100 dark:bg-[#0C1729]",
          "min-h-[50px] aspect-[320/50] md:aspect-[728/90] md:min-h-[90px]",
          className
        )}
      >
        {/* Main Clickable Banner Area */}
        <button
          type="button"
          onClick={() => setSelectedModalAd(currentAd)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              goToNext();
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              goToPrev();
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedModalAd(currentAd);
            }
          }}
          aria-haspopup="dialog"
          aria-label={`View ad details for ${adLabel}. Slide ${activeIndex + 1} of ${ads.length}. Click to view details.`}
          className="w-full h-full block text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upsa-gold"
        >
          {/* Active Banner Image with Fade Transition */}
          {imageToDisplay ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentAd.id || activeIndex}
              src={imageToDisplay}
              alt={adLabel}
              className="w-full h-full object-cover transition-opacity duration-500 ease-out animate-in fade-in-50"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              {adLabel}
            </div>
          )}

          {/* Hover Overlay Cue */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-end p-2 sm:p-3 pointer-events-none">
            <div className="text-white text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 drop-shadow-md">
              <Sparkles className="h-3 w-3 text-upsa-gold" />
              <span className="truncate">Click to view advertiser details & offer</span>
            </div>
          </div>
        </button>

        {/* Top-Left: Multi-Ad Slide Counter Pill */}
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md text-[9px] uppercase font-bold text-white px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5 shadow-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-upsa-gold animate-pulse" />
            <span>Ad {activeIndex + 1} of {ads.length}</span>
            {isPaused && <Pause className="h-2 w-2 text-upsa-gold ml-0.5" />}
          </div>
        </div>

        {/* Top-Right: Ad Tag Badge */}
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-md text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1 shadow-md border border-white/10 group-hover:bg-upsa-navy group-hover:border-upsa-gold/50 transition-colors">
            <span>Details</span>
            <Info className="h-2.5 w-2.5 text-upsa-gold" />
          </div>
        </div>

        {/* Carousel Prev Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          aria-label="Previous advertisement"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Carousel Next Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          aria-label="Next advertisement"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 focus:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center items-center gap-1.5 z-20 pointer-events-auto">
          {ads.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-1.5 transition-all duration-300 rounded-full cursor-pointer focus:outline-none",
                idx === activeIndex
                  ? "w-6 bg-upsa-gold shadow-sm"
                  : "w-2 bg-white/60 hover:bg-white/90"
              )}
            />
          ))}
        </div>
      </div>

      {/* Selected Ad Detail Modal */}
      <AdDetailModal
        ad={selectedModalAd}
        isOpen={selectedModalAd !== null}
        onClose={() => setSelectedModalAd(null)}
      />
    </>
  );
}

