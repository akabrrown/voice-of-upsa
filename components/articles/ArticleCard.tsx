"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Share2, Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  slug: string;
  author?: string;
}

export function ArticleCard({ title, excerpt, category, date, readTime, image, slug, author }: ArticleCardProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const base = window.location.origin || "https://www.voiceofupsa.com";
      setShareUrl(`${base}/articles/${slug}`);
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        setCanNativeShare(true);
      }
    }
  }, [slug]);

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const targetUrl = shareUrl || (typeof window !== "undefined" ? `${window.location.origin}/articles/${slug}` : `https://www.voiceofupsa.com/articles/${slug}`);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = targetUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success("Article link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetUrl = shareUrl || (typeof window !== "undefined" ? `${window.location.origin}/articles/${slug}` : `https://www.voiceofupsa.com/articles/${slug}`);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt || title,
          url: targetUrl,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const activeUrl = shareUrl || `https://www.voiceofupsa.com/articles/${slug}`;
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n${activeUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(activeUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(activeUrl)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(activeUrl)}`,
  };

  return (
    <article className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
      <Link href={`/articles/${slug}`} className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold">
            {category}
          </Badge>
        </div>
      </Link>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] uppercase tracking-widest text-gray-400 mb-3 font-bold">
          <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {date}</span>
          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {readTime}</span>
          {author && <span className="flex items-center normal-case">By {author}</span>}
        </div>
        
        <Link href={`/articles/${slug}`}>
          <h3 className="text-xl font-bold text-upsa-navy mb-2 line-clamp-2 hover:text-upsa-gold transition-colors">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
          {excerpt}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <Link 
            href={`/articles/${slug}`} 
            className="text-sm font-bold text-upsa-navy hover:text-upsa-gold flex items-center transition-colors"
          >
            Read More
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Share ${title}`}
                title="Share article"
                className="text-gray-400 hover:text-upsa-navy hover:bg-gray-50 p-1.5 rounded-full transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-upsa-gold/40"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1.5 bg-white shadow-xl border border-gray-100 rounded-xl z-50">
              <DropdownMenuLabel className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                Share Article
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-gray-100" />
              
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                <span>{copied ? "Link Copied!" : "Copy Link"}</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href={shareLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-50 text-gray-700 hover:text-[#25D366]"
                >
                  <svg className="h-4 w-4 fill-[#25D366] shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700 hover:text-black"
                >
                  <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L10.8 15.4l-6 6.9H1.5l7.6-8.7L1 2.4h6.9l4.7 6.2 5.6-6.2zm-1.2 17.6h1.8L7.1 4.3H5.2l11.8 15.7z" />
                  </svg>
                  <span>X (Twitter)</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 text-gray-700 hover:text-[#1877F2]"
                >
                  <svg className="h-4 w-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h2V1H13c-3 0-5 2-5 5v2z" />
                  </svg>
                  <span>Facebook</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-50 text-gray-700 hover:text-[#0A66C2]"
                >
                  <svg className="h-4 w-4 fill-[#0A66C2] shrink-0" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.8 0-5 2.2-5 5v14c0 2.8 2.2 5 5 5h14c2.8 0 5-2.2 5-5v-14c0-2.8-2.2-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.3c-.9 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7 1.7.8 1.7 1.7-.8 1.7-1.7 1.7zm13.5 12.3h-3v-5.6c0-3.4-4-3.1-4 0v5.6h-3v-11h3v1.8c1.4-2.6 7-2.8 7 2.5v6.7z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>
              </DropdownMenuItem>

              {canNativeShare && (
                <>
                  <DropdownMenuSeparator className="my-1 bg-gray-100" />
                  <DropdownMenuItem
                    onClick={handleNativeShare}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 text-gray-700"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-500 shrink-0" />
                    <span>More Options...</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
