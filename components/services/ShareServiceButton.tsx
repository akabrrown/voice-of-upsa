"use client";

import { Share2, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface ShareServiceButtonProps {
  title: string;
  text: string;
}

export function ShareServiceButton({ title, text }: ShareServiceButtonProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
            console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch on the icon

  return (
    <button 
      onClick={handleShare}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors rounded-md border border-gray-200 bg-white text-upsa-navy hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-upsa-navy focus:ring-offset-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-green-700">Copied Link</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 mr-2" />
          Share Service
        </>
      )}
    </button>
  );
}
