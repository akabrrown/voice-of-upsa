"use client";

import { useEffect, useState } from "react";
import { CalendarHeart, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { ComputedHoliday } from "@/lib/holidays/types";

export function UpcomingHolidayWidget() {
  const [upcoming, setUpcoming] = useState<(ComputedHoliday & { daysRemaining: number }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const res = await fetch("/api/holidays/upcoming");
        if (!res.ok) return;
        const data = await res.json();
        if (data.upcoming) {
          setUpcoming(data.upcoming);
        }
      } catch (err) {
        console.warn("Error fetching upcoming holiday:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcoming();
  }, []);

  if (loading || !upcoming) {
    return null;
  }

  // Format date readable (e.g. "Friday, 6 March 2026")
  const dateObj = new Date(upcoming.observedDate + "T00:00:00Z");
  const formattedDate = dateObj.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-upsa-gold/15 rounded-lg text-upsa-navy">
            <CalendarHeart className="h-4 w-4 text-upsa-gold" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-upsa-navy">
            Next Public Holiday
          </span>
        </div>
        
        {upcoming.daysRemaining === 0 ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 animate-pulse">
            Today
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-upsa-navy text-white">
            {upcoming.daysRemaining} {upcoming.daysRemaining === 1 ? "day" : "days"} away
          </span>
        )}
      </div>

      {/* Holiday Info */}
      <div className="space-y-1.5">
        <h4 className="font-extrabold text-sm text-upsa-navy leading-tight">
          {upcoming.title}
        </h4>
        
        <p className="text-xs text-gray-500 flex items-center">
          <Clock className="h-3 w-3 mr-1 text-upsa-gold shrink-0" />
          <span>{formattedDate}</span>
          {upcoming.isRollover && (
            <span className="ml-1.5 text-[10px] text-amber-700 font-semibold">(Observed)</span>
          )}
        </p>

        <p className="text-[11px] text-gray-600 italic line-clamp-2 pt-1">
          &ldquo;{upcoming.headline}&rdquo;
        </p>
      </div>

      {/* Campus Status Notice */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
        <span className="truncate pr-2">{upcoming.academicStatus}</span>
      </div>
    </div>
  );
}
