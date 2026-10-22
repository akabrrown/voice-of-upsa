"use client";

import { useState } from "react";
import { Link as LinkIcon, MessageCircle, Check } from "lucide-react";
import { Facebook, Twitter, Linkedin } from "@/components/shared/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function ShareButtons({ url, title, className, orientation = "horizontal" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleShare = async (platform: string, shareUrl: string) => {
    // 1. Log the share in analytics
    try {
      await fetch("/api/metrics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: "article",
          entity_slug: url.split("/").pop() || "unknown", // heuristic
          metric_type: "share"
        })
      });
    } catch (e) {
      // Silently fail analytics
    }

    // 2. Open share window
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const platforms = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600 text-white",
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black hover:bg-gray-800 text-white",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-[#0A66C2] hover:bg-[#004182] text-white",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2] hover:bg-[#0C58C3] text-white",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", orientation === "vertical" ? "flex-col" : "flex-row", className)}>
      {platforms.map((p) => {
        const Icon = p.icon;
        return (
          <Button
            key={p.id}
            size="icon"
            variant="ghost"
            aria-label={`Share story on ${p.name}`}
            className={cn("h-10 w-10 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95", p.color)}
            onClick={() => handleShare(p.id, p.url)}
            title={`Share on ${p.name}`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </Button>
        );
      })}
      
      <Button
        size="icon"
        variant="outline"
        aria-label="Copy story link to clipboard"
        className="h-10 w-10 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 bg-white dark:bg-[#0C1729] hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/10"
        onClick={() => handleShare("copy", "")}
        title="Copy link"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <LinkIcon className="w-4 h-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}
