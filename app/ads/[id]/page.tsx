import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Mail,
  Building,
  User as UserIcon,
  Phone,
  ShieldCheck,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/auth/urls";
import { AdShareSection } from "@/components/ads/AdShareSection";
import { format } from "date-fns";

interface AdDetailsProps {
  params: Promise<{
    id: string;
  }>;
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

function getAbsoluteImageUrl(rawImage?: string | null, siteUrl: string = ""): string {
  if (!rawImage || typeof rawImage !== "string") {
    return `${siteUrl}/images/default-og.png`;
  }
  const trimmed = rawImage.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${siteUrl}${trimmed}`;
  }
  return `${siteUrl}/images/default-og.png`;
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

// 1. Dynamic OpenGraph, Twitter, and Search Engine Metadata
export async function generateMetadata({ params }: AdDetailsProps): Promise<Metadata> {
  const { id } = await params;
  const supabaseAdmin = getAdminClient();

  const { data: ad } = await supabaseAdmin
    .from("advertisements")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!ad) {
    return {
      title: "Advertisement Not Found | Voice of UPSA",
    };
  }

  const siteUrl = getSiteUrl();
  const adUrl = `${siteUrl}/ads/${id}`;
  const title = ad.product_name || ad.company_name;
  const description =
    ad.product_description?.trim() ||
    `Official campus advertisement from ${ad.company_name} on Voice of UPSA. Discover student offers, discounts, and verified campus partner services.`;
  
  const rawImage = ad.banner_image_url || ad.creative_url;
  const ogImage = getAbsoluteImageUrl(rawImage, siteUrl);

  return {
    title: `${title} - ${ad.company_name} | Voice of UPSA`,
    description,
    alternates: {
      canonical: adUrl,
    },
    openGraph: {
      title: `${title} - ${ad.company_name}`,
      description,
      url: adUrl,
      siteName: "Voice of UPSA",
      locale: "en_GH",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${title} - ${ad.company_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - ${ad.company_name}`,
      description,
      images: [ogImage],
      site: "@voiceofupsa",
      creator: "@voiceofupsa",
    },
  };
}

export default async function AdDetailsPage({ params }: AdDetailsProps) {
  const { id } = await params;
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  const supabaseAdmin = getAdminClient();
  const { data: ad, error } = await supabaseAdmin
    .from("advertisements")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ad) {
    notFound();
  }

  // Prevent unauthorized access to non-active ads (protects advertiser contact PII)
  if (ad.status !== "active" && !isAdmin && ad.submitted_by !== user?.id) {
    notFound();
  }

  const safeTargetUrl = isSafeUrl(ad.target_url) ? ad.target_url.trim() : null;
  const imageToDisplay = ad.banner_image_url || ad.creative_url;
  const title = ad.product_name || ad.company_name;
  const placementName = ad.ad_placement || ad.ad_type || "Campus Spotlight";
  const siteUrl = getSiteUrl();
  const adUrl = `${siteUrl}/ads/${ad.id}`;

  const startDateFormatted = formatDateSafe(ad.start_date || ad.starts_at);
  const endDateFormatted = formatDateSafe(ad.end_date || ad.ends_at);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 dark:bg-[#060D1A] py-10 md:py-16 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-upsa-navy dark:hover:text-upsa-gold transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Campus News</span>
            </Link>

            <Link
              href="/advertise"
              className="text-xs font-bold text-upsa-navy dark:text-upsa-gold hover:underline"
            >
              Advertise on Voice of UPSA →
            </Link>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-[#0C1729] rounded-3xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Banner Creative Image */}
            {imageToDisplay && (
              <div className="w-full h-64 md:h-96 relative bg-gray-100 dark:bg-black/30 border-b border-gray-200 dark:border-white/10 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageToDisplay} 
                  alt={title}
                  className="max-h-full max-w-full object-contain mx-auto rounded-lg"
                />
              </div>
            )}

            <div className="p-6 sm:p-8 md:p-12 space-y-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:bg-upsa-gold/15 dark:text-upsa-gold border border-amber-500/20 dark:border-upsa-gold/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Campus Advertiser
                </span>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Sponsored • {placementName}
                </span>

                {(ad.ad_tier || ad.package_tier) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-upsa-navy/10 text-upsa-navy dark:bg-white/5 dark:text-slate-300 capitalize">
                    {ad.ad_tier || ad.package_tier} Tier
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-upsa-navy dark:text-white tracking-tight leading-tight mb-4">
                  {title}
                </h1>
                <p className="text-base sm:text-lg text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {ad.product_description || `Official sponsored campaign from ${ad.company_name} on Voice of UPSA.`}
                </p>
              </div>

              {/* Social Sharing Component (OG, Description & Link) */}
              <AdShareSection
                title={title}
                companyName={ad.company_name}
                description={ad.product_description}
                adUrl={adUrl}
              />

              {/* Contact Information Card */}
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                  <Building className="h-4 w-4 text-upsa-gold" />
                  Advertiser Contact & Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-700 dark:text-slate-300">
                    <Building className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                    <span className="font-semibold text-gray-900 dark:text-white">{ad.company_name}</span>
                  </div>

                  {ad.contact_name && (
                    <div className="flex items-center text-gray-700 dark:text-slate-300">
                      <UserIcon className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                      <span>{ad.contact_name}</span>
                    </div>
                  )}

                  {ad.contact_email && (
                    <div className="flex items-center text-gray-700 dark:text-slate-300">
                      <Mail className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                      <a 
                        href={`mailto:${ad.contact_email}`} 
                        className="text-upsa-navy dark:text-upsa-gold hover:underline font-medium truncate"
                      >
                        {ad.contact_email}
                      </a>
                    </div>
                  )}

                  {ad.contact_phone && (
                    <div className="flex items-center text-gray-700 dark:text-slate-300">
                      <Phone className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                      <a 
                        href={`tel:${ad.contact_phone}`} 
                        className="text-upsa-navy dark:text-upsa-gold hover:underline font-medium"
                      >
                        {ad.contact_phone}
                      </a>
                    </div>
                  )}

                  {(startDateFormatted || endDateFormatted) && (
                    <div className="flex items-center text-gray-600 dark:text-slate-400 col-span-1 sm:col-span-2 pt-2 border-t border-gray-200 dark:border-white/5">
                      <Calendar className="h-4 w-4 mr-3 text-gray-400 shrink-0" />
                      <span>
                        Active Schedule: {startDateFormatted || "Ongoing"} {endDateFormatted ? `to ${endDateFormatted}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Primary Call to Action */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {safeTargetUrl && (
                  <a 
                    href={safeTargetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-upsa-navy hover:bg-[#002244] dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-[#dfb945] rounded-xl transition-all shadow-lg shadow-upsa-navy/20 dark:shadow-none active:scale-[0.99]"
                  >
                    <span>Visit Official Website</span>
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
