"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  ArrowUpRight,
  BadgeCheck,
  Star,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Users,
  Eye,
  Calendar,
  Sparkles,
} from "lucide-react";

interface AdFallbackCardProps {
  type: "leaderboard" | "sidebar" | "in-feed";
  className?: string;
}

export function AdFallbackCard({ type, className }: AdFallbackCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const placementDetails = {
    leaderboard: {
      title: "Amplify Your Brand Across UPSA Campus",
      subtitle: "Prime Leaderboard Placement (728x90 desktop / 320x50 mobile)",
      badge: "Voice of UPSA Media",
      reach: "25,000+ Students & Staff",
      price: "From GH₵ 350 / week",
      description:
        "The top-of-page leaderboard is the premier billboard of Voice of UPSA. Positioned directly beneath breaking news, it receives the highest visibility and engagement rate across all devices.",
      features: [
        "Primary above-the-fold placement",
        "Full desktop & mobile responsive dimensions",
        "Dedicated advertiser profile with direct contact links",
        "Verified campus sponsor badge",
      ],
    },
    sidebar: {
      title: "Connect With 25,000+ Students & Faculty",
      subtitle: "High-Visibility Sticky Sidebar Placement (300x250)",
      badge: "Featured Spot",
      reach: "25,000+ Community Reach",
      price: "From GH₵ 250 / week",
      description:
        "Our high-visibility sidebar spot sits alongside top trending stories, public holidays countdowns, and editorial features. Ideal for student startups, food vendors, events, and education services.",
      features: [
        "Adjacent to trending stories and weekly rankings",
        "Persistent presence across reading journeys",
        "Direct click-to-call and WhatsApp leads",
        "Interactive ad popup with campaign info",
      ],
    },
    "in-feed": {
      title: "Put Your Business Front & Center",
      subtitle: "Native In-Feed Editorial Placement",
      badge: "Official Campus Advertising",
      reach: "Maximum Reader Immersion",
      price: "From GH₵ 300 / week",
      description:
        "Seamlessly integrated into the primary editorial flow of campus news. Designed to capture high-intent readers browsing top stories, opinion pieces, and SRC updates.",
      features: [
        "Native visual appearance matching article feeds",
        "High click-through engagement",
        "Includes full company bio and contact modal",
        "Priority review within 24 business hours",
      ],
    },
  }[type];

  return (
    <>
      {/* Trigger Card Based on Placement Type */}
      {type === "leaderboard" && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "group block w-full max-w-[820px] mx-auto overflow-hidden bg-gray-50 dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 hover:border-upsa-gold text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upsa-gold rounded-lg",
            className
          )}
          aria-label="View Voice of UPSA leaderboard advertising information"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:px-6 md:py-4 h-full min-h-[90px] gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-12 w-12 shrink-0 bg-upsa-navy dark:bg-upsa-gold/20 items-center justify-center text-white dark:text-upsa-gold rounded-lg shadow-sm">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-upsa-navy dark:text-upsa-gold flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" /> Voice of UPSA Media
                  </span>
                  <span className="text-[9px] bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-sm font-semibold">
                    25k+ Reach
                  </span>
                </div>
                <h4 className="text-slate-900 dark:text-white text-sm md:text-base font-bold tracking-tight group-hover:text-upsa-gold transition-colors">
                  Amplify Your Brand Across UPSA Campus
                </h4>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy text-xs font-bold group-hover:bg-upsa-gold group-hover:text-upsa-navy dark:group-hover:bg-upsa-gold/90 transition-colors rounded-md shadow-sm">
                <span>Ad Info</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </button>
      )}

      {type === "sidebar" && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "group block w-full max-w-[300px] mx-auto overflow-hidden bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 hover:border-upsa-navy dark:hover:border-upsa-gold text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upsa-gold rounded-xl shadow-sm",
            className
          )}
          aria-label="View Voice of UPSA sidebar advertising packages"
        >
          <div className="relative h-[250px] w-full flex flex-col justify-between p-5 bg-gray-50 dark:bg-[#0C1729]">
            <div className="flex justify-between items-start">
              <span className="inline-flex items-center gap-1 bg-upsa-navy dark:bg-upsa-gold text-[9px] uppercase font-bold text-white dark:text-upsa-navy px-2 py-1 rounded-sm">
                <Star className="h-2.5 w-2.5 text-upsa-gold dark:text-upsa-navy" /> Featured Spot
              </span>
            </div>

            <div className="mt-auto">
              <h4 className="text-slate-900 dark:text-white font-black text-lg tracking-tight leading-tight group-hover:text-upsa-gold transition-colors">
                Connect With 25,000+ Students & Faculty
              </h4>
              <p className="text-gray-600 dark:text-slate-400 text-xs mt-2 leading-relaxed font-medium">
                High-visibility placements & editorial spotlights.
              </p>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400 font-bold block">Tiers From</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">GH₵ 250 / wk</span>
                </div>
                <div className="inline-flex items-center gap-1 text-upsa-navy dark:text-upsa-gold text-xs font-bold group-hover:text-upsa-gold transition-colors">
                  <span>Explore Info</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </button>
      )}

      {type === "in-feed" && (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "group block w-full overflow-hidden bg-upsa-navy dark:bg-[#0C1729] border border-upsa-navy dark:border-white/10 hover:bg-[#001f40] dark:hover:bg-[#111f38] text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upsa-gold rounded-xl shadow-md",
            className
          )}
          aria-label="View Voice of UPSA native in-feed advertising details"
        >
          <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 shrink-0 bg-white/10 flex items-center justify-center text-upsa-gold rounded-xl">
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
                <p className="text-gray-300 dark:text-slate-300 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
                  Target campus customers with native feed placements and customized editorial features.
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end md:self-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-upsa-gold text-upsa-navy text-xs md:text-sm font-bold hover:bg-white transition-colors rounded-lg shadow-sm">
                <span>Explore Packages</span>
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Information Modal For Advertising Opportunities */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1729] shadow-2xl rounded-2xl">
          <div className="bg-gradient-to-r from-upsa-navy via-[#002244] to-upsa-navy p-6 text-white border-b border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-upsa-gold text-upsa-navy">
                <Sparkles className="h-3 w-3" />
                Campus Ad Opportunity
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">
                • {placementDetails.reach}
              </span>
            </div>

            <DialogHeader className="text-left gap-1">
              <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {placementDetails.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 font-medium">
                {placementDetails.subtitle}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              {placementDetails.description}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5 py-2">
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-center">
                <Users className="h-4 w-4 text-upsa-navy dark:text-upsa-gold mx-auto mb-1" />
                <span className="block text-sm font-black text-slate-900 dark:text-white">25k+</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Students & Staff</span>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-center">
                <Eye className="h-4 w-4 text-upsa-navy dark:text-upsa-gold mx-auto mb-1" />
                <span className="block text-sm font-black text-slate-900 dark:text-white">100%</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Verified Views</span>
              </div>
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-center">
                <Calendar className="h-4 w-4 text-upsa-navy dark:text-upsa-gold mx-auto mb-1" />
                <span className="block text-sm font-black text-slate-900 dark:text-white">24h</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Fast Review</span>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2 bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                What You Get With This Placement
              </h4>
              <ul className="space-y-2">
                {placementDetails.features.map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/advertise"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-upsa-navy hover:bg-[#002244] dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-[#dfb945] transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <span>Book This Placement ({placementDetails.price})</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="sm:w-auto px-5 py-3.5 text-xs font-semibold rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
