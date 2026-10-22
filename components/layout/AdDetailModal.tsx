"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  User as UserIcon,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Copy,
  Check,
  ArrowUpRight,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AdShareSection } from "@/components/ads/AdShareSection";

export interface AdRecord {
  id?: string;
  company_name: string;
  product_name?: string | null;
  product_description?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  banner_image_url?: string | null;
  creative_url?: string | null;
  featured_image?: string | null;
  image_url?: string | null;
  target_url?: string | null;
  ad_placement?: string | null;
  ad_type?: string | null;
  ad_tier?: string | null;
  package_tier?: string | null;
  start_date?: string | null;
  starts_at?: string | null;
  end_date?: string | null;
  ends_at?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
}

interface AdDetailModalProps {
  ad: AdRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

function isSafeUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function formatDateSafe(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return format(d, "MMM d, yyyy");
  } catch {
    return null;
  }
}

export function AdDetailModal({ ad, isOpen, onClose }: AdDetailModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!ad) return null;

  const imageSrc = ad.banner_image_url || ad.creative_url || ad.featured_image || ad.image_url;
  const safeTargetUrl = isSafeUrl(ad.target_url) ? ad.target_url!.trim() : null;
  const placementName = ad.ad_placement || ad.ad_type || "Campus Spotlight";
  const tierName = ad.ad_tier || ad.package_tier || "Featured Partner";
  const title = ad.product_name || ad.company_name;

  const startDateFormatted = formatDateSafe(ad.start_date || ad.starts_at);
  const endDateFormatted = formatDateSafe(ad.end_date || ad.ends_at);
  const adShareUrl = ad.id ? `/ads/${ad.id}` : (safeTargetUrl || "");

  const handleCopyEmail = async () => {
    if (!ad.contact_email) return;
    try {
      await navigator.clipboard.writeText(ad.contact_email);
      setCopiedEmail(true);
      toast.success("Advertiser email copied to clipboard");
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      toast.error("Failed to copy email");
    }
  };

  const handleCopyShareLink = async () => {
    try {
      const shareUrl = ad.id 
        ? `${window.location.origin}/ads/${ad.id}` 
        : (safeTargetUrl || window.location.href);
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Ad link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="max-w-[calc(100%-2rem)] sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1729] shadow-2xl rounded-2xl"
        showCloseButton={true}
      >
        {/* Header Ribbon / Verification Badge */}
        <div className="bg-gradient-to-r from-upsa-navy via-[#00264d] to-upsa-navy p-5 sm:p-6 text-white border-b border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-upsa-gold/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-wrap items-center gap-2 mb-2 relative z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-upsa-gold text-upsa-navy shadow-sm">
              <ShieldCheck className="h-3 w-3" />
              Verified Campus Advertiser
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/15 text-white/90">
              <Sparkles className="h-2.5 w-2.5 text-upsa-gold" />
              {placementName}
            </span>

            {tierName && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-medium text-slate-300">
                • {tierName.toUpperCase()}
              </span>
            )}
          </div>

          <DialogHeader className="gap-1 relative z-10 text-left">
            <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <Building2 className="h-3.5 w-3.5 text-upsa-gold" />
              <span>{ad.company_name}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Ad Banner Image Preview */}
          {imageSrc && (
            <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 shadow-inner group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-auto max-h-[280px] object-contain mx-auto"
                loading="eager"
              />
            </div>
          )}

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              About This Campaign
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
              {ad.product_description || 
                `Official sponsored campaign from ${ad.company_name} featured on Voice of UPSA. Dedicated to providing value, student discounts, and trusted services to the UPSA community.`}
            </p>
          </div>

          {/* Advertiser Contact Card */}
          <div className="bg-slate-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl p-4 sm:p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-upsa-gold" />
                Advertiser Information
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-upsa-navy dark:hover:text-upsa-gold inline-flex items-center gap-1 transition-colors"
                title="Share or copy link"
              >
                {copiedLink ? <Check className="h-3 w-3 text-emerald-500" /> : <Share2 className="h-3 w-3" />}
                <span>{copiedLink ? "Copied" : "Share Ad"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {ad.contact_name && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <UserIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    <strong className="text-slate-900 dark:text-white font-medium">Contact:</strong> {ad.contact_name}
                  </span>
                </div>
              )}

              {ad.contact_email && (
                <div className="flex items-center justify-between gap-1 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <a 
                      href={`mailto:${ad.contact_email}`}
                      className="text-upsa-navy dark:text-upsa-gold hover:underline font-semibold truncate"
                    >
                      {ad.contact_email}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-slate-500 transition-colors"
                    title="Copy email address"
                    aria-label="Copy email address"
                  >
                    {copiedEmail ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              )}

              {ad.contact_phone && (
                <div className="flex items-center justify-between gap-1 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <a 
                      href={`tel:${ad.contact_phone}`}
                      className="text-upsa-navy dark:text-upsa-gold hover:underline font-semibold truncate"
                    >
                      {ad.contact_phone}
                    </a>
                  </div>
                  <a
                    href={`tel:${ad.contact_phone}`}
                    className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-upsa-gold/20 text-upsa-navy dark:text-upsa-gold hover:bg-upsa-gold/30 transition-colors"
                  >
                    Call
                  </a>
                </div>
              )}

              {(startDateFormatted || endDateFormatted) && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 col-span-1 sm:col-span-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    Active: {startDateFormatted || "Ongoing"} {endDateFormatted ? `to ${endDateFormatted}` : ""}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Social Sharing Section with OpenGraph, Description & Link */}
          {adShareUrl && (
            <AdShareSection
              title={title}
              companyName={ad.company_name}
              description={ad.product_description}
              adUrl={adShareUrl}
            />
          )}

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {safeTargetUrl ? (
              <a
                href={safeTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-upsa-navy hover:bg-[#002244] dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-[#dfb945] transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                <span>Visit Official Website</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}

            {ad.id && (
              <Link
                href={`/ads/${ad.id}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 transition-colors"
              >
                <span>View Ad Page</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="sm:w-auto px-5 py-3.5 text-xs font-semibold rounded-xl"
            >
              Close
            </Button>
          </div>

          {/* Campus Advertising Promo Notice */}
          <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Want your brand or service seen by 25,000+ students?
            </span>
            <Link
              href="/advertise"
              onClick={onClose}
              className="text-xs font-bold text-upsa-navy dark:text-upsa-gold hover:underline inline-flex items-center gap-1"
            >
              <span>Advertise With Us</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
