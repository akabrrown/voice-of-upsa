"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const sanitizedContent = useMemo(() => {
    if (typeof window === "undefined") {
      return content;
    }
    try {
      return DOMPurify.sanitize(content, {
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "target"],
      });
    } catch (e) {
      console.warn("DOMPurify sanitization fallback:", e);
      return content;
    }
  }, [content]);

  return (
    <div
      className="prose prose-lg max-w-none whitespace-pre-wrap prose-headings:text-upsa-navy dark:prose-headings:text-white prose-headings:font-black prose-p:text-gray-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-upsa-gold dark:prose-a:text-upsa-gold prose-strong:text-upsa-navy dark:prose-strong:text-white prose-blockquote:border-upsa-gold prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-white/5 dark:prose-blockquote:text-slate-200 prose-blockquote:rounded-r-xl dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
