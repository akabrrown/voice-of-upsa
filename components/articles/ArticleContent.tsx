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
      className="prose prose-lg max-w-none whitespace-pre-wrap prose-headings:text-upsa-navy prose-headings:font-black prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-upsa-gold prose-strong:text-upsa-navy prose-blockquote:border-upsa-gold prose-blockquote:bg-gray-50 prose-blockquote:rounded-r-xl"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
