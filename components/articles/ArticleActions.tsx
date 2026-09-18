"use client";

import { useState, useEffect } from "react";
import { Printer, Share2, Check, Copy } from "lucide-react";
import { toast } from "react-hot-toast";

interface ArticleActionsProps {
  slug: string;
  title: string;
}

export function ArticleActions({ slug, title }: ArticleActionsProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/articles/${slug}`);
    }
  }, [slug]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareUrl}\n\n*${title}*`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Share on WhatsApp */}
      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-emerald-50 rounded-full text-gray-400 hover:text-[#25D366] transition-all duration-200 hover:scale-110 active:scale-95"
        title="Share on WhatsApp"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>

      {/* Share on Facebook */}
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-upsa-navy transition-all duration-200 hover:scale-110 active:scale-95"
        title="Share on Facebook"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h2V1H13c-3 0-5 2-5 5v2z" />
        </svg>
      </a>

      {/* Share on X */}
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-upsa-navy transition-all duration-200 hover:scale-110 active:scale-95"
        title="Share on X"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L10.8 15.4l-6 6.9H1.5l7.6-8.7L1 2.4h6.9l4.7 6.2 5.6-6.2zm-1.2 17.6h1.8L7.1 4.3H5.2l11.8 15.7z" />
        </svg>
      </a>

      {/* Share on LinkedIn */}
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-upsa-navy transition-all duration-200 hover:scale-110 active:scale-95"
        title="Share on LinkedIn"
      >
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.8 0-5 2.2-5 5v14c0 2.8 2.2 5 5 5h14c2.8 0 5-2.2 5-5v-14c0-2.8-2.2-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.3c-.9 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7 1.7.8 1.7 1.7-.8 1.7-1.7 1.7zm13.5 12.3h-3v-5.6c0-3.4-4-3.1-4 0v5.6h-3v-11h3v1.8c1.4-2.6 7-2.8 7 2.5v6.7z" />
        </svg>
      </a>

      {/* Copy Link Button */}
      <button
        onClick={handleCopyLink}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-upsa-navy transition-all duration-200 hover:scale-110 active:scale-95"
        title="Copy article link"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-upsa-navy transition-all duration-200 hover:scale-110 active:scale-95"
        title="Print article"
      >
        <Printer className="h-4 w-4" />
      </button>
    </div>
  );
}
