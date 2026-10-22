"use client";

import { useState, useEffect } from "react";
import { Link as LinkIcon, MessageCircle, Check, Share2, Copy } from "lucide-react";
import { Facebook, Twitter, Linkedin } from "@/components/shared/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdShareSectionProps {
  title: string;
  companyName: string;
  description?: string | null;
  adUrl: string;
  className?: string;
  compact?: boolean;
}

export function AdShareSection({
  title,
  companyName,
  description,
  adUrl,
  className,
  compact = false,
}: AdShareSectionProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const [resolvedUrl, setResolvedUrl] = useState(adUrl);

  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
    if (adUrl.startsWith("/") && typeof window !== "undefined") {
      setResolvedUrl(`${window.location.origin}${adUrl}`);
    } else {
      setResolvedUrl(adUrl);
    }
  }, [adUrl]);

  const cleanDescription = (description || "").trim();
  const descriptionSnippet = cleanDescription.length > 180
    ? `${cleanDescription.slice(0, 177)}...`
    : cleanDescription;

  const fullShareText = `📢 ${title} (${companyName})\n\n${descriptionSnippet ? `${descriptionSnippet}\n\n` : ""}🔗 Check it out on Voice of UPSA: ${resolvedUrl}`;

  const encodedUrl = encodeURIComponent(resolvedUrl);
  const encodedWhatsappText = encodeURIComponent(
    `*${title}* (${companyName})\n\n${descriptionSnippet ? `${descriptionSnippet}\n\n` : ""}👉 ${resolvedUrl}`
  );
  const encodedTwitterText = encodeURIComponent(
    `${title} by ${companyName} on @voiceofupsa ${descriptionSnippet ? `— ${descriptionSnippet.slice(0, 90)}...` : ""}`
  );

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - ${companyName}`,
          text: descriptionSnippet || `Check out ${title} on Voice of UPSA`,
          url: resolvedUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopiedLink(true);
      toast.success("Ad link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyFullInfo = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopiedFull(true);
      toast.success("Full ad details & link copied to clipboard!");
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      toast.error("Failed to copy details");
    }
  };

  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-emerald-600 hover:bg-emerald-700 text-white",
      href: `https://api.whatsapp.com/send?text=${encodedWhatsappText}`,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black hover:bg-neutral-800 text-white dark:bg-white/10 dark:hover:bg-white/20",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTwitterText}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-[#0A66C2] hover:bg-[#004182] text-white",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2] hover:bg-[#0C58C3] text-white",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  if (compact) {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {canNativeShare && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleNativeShare}
            className="h-8 px-2.5 text-xs font-semibold rounded-lg bg-upsa-gold/15 text-upsa-navy dark:text-upsa-gold border-upsa-gold/30 hover:bg-upsa-gold/25"
            title="Share via device"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Share</span>
          </Button>
        )}

        {platforms.slice(0, 2).map((p) => {
          const Icon = p.icon;
          return (
            <a
              key={p.id}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${p.name}`}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-xs hover:scale-105 active:scale-95",
                p.color
              )}
              title={`Share on ${p.name}`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          );
        })}

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyFullInfo}
          className="h-8 px-2.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300"
          title="Copy title, description and link"
        >
          {copiedFull ? (
            <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1.5" />
          )}
          <span>{copiedFull ? "Copied" : "Copy Details"}</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <Share2 className="h-4 w-4 text-upsa-navy dark:text-upsa-gold" />
            Share Campaign (OG, Title, Description & Link)
          </span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Includes official OpenGraph preview card, description snippet, and direct link.
          </p>
        </div>

        {canNativeShare && (
          <Button
            size="sm"
            onClick={handleNativeShare}
            className="h-8 px-3 text-xs font-bold bg-upsa-navy text-white hover:bg-[#00264d] dark:bg-upsa-gold dark:text-upsa-navy shadow-sm self-start sm:self-center"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Share via App</span>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {platforms.map((p) => {
          const Icon = p.icon;
          return (
            <a
              key={p.id}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${p.name}`}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-95",
                p.color
              )}
              title={`Share on ${p.name}`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{p.name}</span>
            </a>
          );
        })}

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          className="h-9 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          title="Copy direct ad link"
        >
          {copiedLink ? (
            <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
          ) : (
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
          )}
          <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyFullInfo}
          className="h-9 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
          title="Copy formatted message with title, description, and link"
        >
          {copiedFull ? (
            <Check className="h-3.5 w-3.5 text-emerald-500 mr-1.5" />
          ) : (
            <Copy className="h-3.5 w-3.5 mr-1.5" />
          )}
          <span>{copiedFull ? "Details Copied" : "Copy Full Details"}</span>
        </Button>
      </div>
    </div>
  );
}
