"use client";

import { useEffect, useState } from "react";
import { X, Share2, Check, CalendarHeart, Church, Moon, Award } from "lucide-react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { ComputedHoliday, HolidayThemeAccent } from "@/lib/holidays/types";

interface HolidayGreetingModalProps {
  forcePreviewHoliday?: ComputedHoliday | null;
  onClosePreview?: () => void;
}

export function HolidayGreetingModal({ forcePreviewHoliday, onClosePreview }: HolidayGreetingModalProps) {
  const [holiday, setHoliday] = useState<ComputedHoliday | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (forcePreviewHoliday) {
      setHoliday(forcePreviewHoliday);
      setIsOpen(true);
      return;
    }

    const checkFirstVisit = async () => {
      try {
        const res = await fetch("/api/holidays/today");
        if (!res.ok) return;
        const data = await res.json();
        if (data.isHoliday && data.holiday) {
          const cooldownKey = `vou_holiday_modal_${data.holiday.key}_${data.holiday.observedDate}`;
          const alreadySeen = localStorage.getItem(cooldownKey);
          if (!alreadySeen) {
            setHoliday(data.holiday);
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.warn("Could not check holiday modal status:", err);
      }
    };

    checkFirstVisit();
  }, [forcePreviewHoliday]);

  const handleClose = () => {
    if (holiday && !forcePreviewHoliday) {
      const cooldownKey = `vou_holiday_modal_${holiday.key}_${holiday.observedDate}`;
      localStorage.setItem(cooldownKey, "true");
    }
    setIsOpen(false);
    if (onClosePreview) onClosePreview();
  };

  const handleShareWhatsApp = () => {
    if (!holiday) return;
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://voiceofupsa.com";
    const text = encodeURIComponent(
      `🎉 *${holiday.headline}*\n\n"${holiday.bodyMessage}"\n\n📌 *Campus Notice:* ${holiday.academicStatus}\n\nRead more on Voice of UPSA:\n${siteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleCopyWishes = async () => {
    if (!holiday) return;
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://voiceofupsa.com";
    const text = `${holiday.headline}\n\n"${holiday.bodyMessage}"\n\nCampus Notice: ${holiday.academicStatus}\n\nVoice of UPSA: ${siteUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Wishes copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy wishes.");
    }
  };

  if (!isOpen || !holiday) return null;

  const renderThemeBadge = (theme: HolidayThemeAccent) => {
    switch (theme) {
      case "ghana_flag":
        return <span className="text-xl">🇬🇭</span>;
      case "crescent":
        return <Moon className="h-6 w-6 text-emerald-400 fill-emerald-400" />;
      case "laurel":
        return <Award className="h-6 w-6 text-upsa-gold" />;
      case "festive":
        return <Church className="h-6 w-6 text-amber-300 fill-amber-300" />;
      default:
        return <CalendarHeart className="h-6 w-6 text-upsa-gold" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="holiday-modal-title"
      >
        {/* Header Ribbon / Banner */}
        <div className="relative bg-gradient-to-br from-upsa-navy via-upsa-dark-navy to-upsa-navy text-white p-6 sm:p-8 text-center overflow-hidden">
          <div className="absolute -right-12 -top-12 w-36 h-36 bg-upsa-gold/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-upsa-gold/10 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close holiday greetings"
            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* University Seal & Theme Icon */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-upsa-gold shadow-lg bg-white">
              <Image src="/logo.jpg" alt="Voice of UPSA" fill sizes="80px" className="object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-upsa-dark-navy rounded-full border border-upsa-gold/50 shadow">
              {renderThemeBadge(holiday.themeAccent)}
            </div>
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest text-upsa-gold bg-upsa-gold/15 mb-3 border border-upsa-gold/30">
            {holiday.title}
          </div>

          <h2 id="holiday-modal-title" className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
            {holiday.headline}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed text-center italic">
            &ldquo;{holiday.bodyMessage}&rdquo;
          </p>

          {/* Campus Academic Status Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-3">
            <div className="p-1 bg-amber-100 rounded-md shrink-0 text-amber-800">
              <CalendarHeart className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold text-amber-900 block">Official Campus Notice:</span>
              <span className="text-amber-800 leading-snug">{holiday.academicStatus}</span>
            </div>
          </div>

          {/* Action Buttons: WhatsApp Share & Copy */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span>Share to WhatsApp Status</span>
            </button>

            <button
              onClick={handleCopyWishes}
              className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-upsa-navy rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-colors active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              <span>{copied ? "Copied!" : "Copy Wishes"}</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={handleClose}
              className="text-xs text-gray-400 hover:text-upsa-navy transition-colors font-medium underline underline-offset-4"
            >
              Continue to Voice of UPSA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
