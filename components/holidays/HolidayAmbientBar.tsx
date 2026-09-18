"use client";

import { useEffect, useState } from "react";
import { Sparkles, Moon, Award, CalendarHeart, X, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ComputedHoliday, HolidayThemeAccent } from "@/lib/holidays/types";

interface HolidayAmbientBarProps {
  initialHoliday?: ComputedHoliday | null;
}

export function HolidayAmbientBar({ initialHoliday = null }: HolidayAmbientBarProps) {
  const [holiday, setHoliday] = useState<ComputedHoliday | null>(initialHoliday);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if user dismissed this specific holiday today
    const checkActiveHoliday = async () => {
      try {
        const res = await fetch("/api/holidays/today");
        if (!res.ok) return;
        const data = await res.json();
        if (data.isHoliday && data.holiday) {
          const dismissKey = `vou_holiday_bar_dismiss_${data.holiday.key}_${data.holiday.observedDate}`;
          const dismissed = sessionStorage.getItem(dismissKey);
          if (!dismissed) {
            setHoliday(data.holiday);
            setIsDismissed(false);
          }
        }
      } catch (err) {
        console.warn("Could not load holiday celebration bar:", err);
      }
    };

    checkActiveHoliday();
  }, []);

  const handleDismiss = () => {
    if (holiday) {
      const dismissKey = `vou_holiday_bar_dismiss_${holiday.key}_${holiday.observedDate}`;
      sessionStorage.setItem(dismissKey, "true");
    }
    setIsDismissed(true);
  };

  if (isDismissed || !holiday) {
    return null;
  }

  const renderIcon = (theme: HolidayThemeAccent) => {
    switch (theme) {
      case "crescent":
        return <Moon className="h-3.5 w-3.5 text-upsa-gold fill-upsa-gold" />;
      case "ghana_flag":
        return <span className="text-xs mr-0.5">🇬🇭</span>;
      case "laurel":
        return <Award className="h-3.5 w-3.5 text-upsa-gold" />;
      case "festive":
        return <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />;
      default:
        return <CalendarHeart className="h-3.5 w-3.5 text-upsa-gold" />;
    }
  };

  const getThemeStyles = (theme: HolidayThemeAccent) => {
    switch (theme) {
      case "ghana_flag":
        return {
          barBg: "bg-gradient-to-r from-red-950/90 via-amber-950/80 to-emerald-950/90 text-white border-b border-amber-500/30",
          badgeBg: "bg-white/10 text-amber-300 border border-amber-400/40",
        };
      case "crescent":
        return {
          barBg: "bg-gradient-to-r from-[#032014] via-[#053d26] to-[#032014] text-white border-b border-emerald-500/30",
          badgeBg: "bg-emerald-900/60 text-emerald-200 border border-emerald-400/30",
        };
      case "festive":
        return {
          barBg: "bg-gradient-to-r from-red-950 via-upsa-navy to-red-950 text-white border-b border-amber-500/30",
          badgeBg: "bg-red-900/60 text-amber-200 border border-amber-400/30",
        };
      default:
        return {
          barBg: "bg-gradient-to-r from-upsa-dark-navy via-upsa-navy to-upsa-dark-navy text-white border-b border-upsa-gold/30",
          badgeBg: "bg-upsa-gold/20 text-upsa-light-gold border border-upsa-gold/40",
        };
    }
  };

  const styles = getThemeStyles(holiday.themeAccent);

  return (
    <aside aria-label="Holiday Notice" className={`relative z-40 py-2 px-4 text-xs shadow-md transition-all duration-300 ${styles.barBg}`}>
      <div className="container mx-auto flex items-center justify-between gap-3">
        {/* Left: Icon, Badge & Headline */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="flex items-center shrink-0">
            {renderIcon(holiday.themeAccent)}
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${styles.badgeBg}`}>
            {holiday.title}
          </span>

          <p className="font-semibold truncate">
            <span className="text-white">{holiday.headline}</span>
            <span className="hidden md:inline text-gray-300 ml-2 font-normal">
              — {holiday.academicStatus}
            </span>
          </p>
        </div>

        {/* Right: Actions (Article Link / Dismiss) */}
        <div className="flex items-center gap-2 shrink-0">
          {holiday.featuredArticleSlug && (
            <Link
              href={`/articles/${holiday.featuredArticleSlug}`}
              className="inline-flex items-center gap-1 font-bold text-[11px] text-upsa-gold hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              <span>Special Feature</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss holiday banner"
            className="p-1 text-gray-400 hover:text-white rounded-full transition-colors hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
