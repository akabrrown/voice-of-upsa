import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export interface ArticleSEOData {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

const SEO_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "for", "with", "about", "against", "between", 
  "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", 
  "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", 
  "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", 
  "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
  "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", 
  "do", "does", "did", "doing", "of", "at", "by", "i", "we", "you", "he", "she", "it", 
  "they", "them", "us", "this", "that", "these", "those", "am"
]);

export function generateArticleSEO(
  title: string,
  excerpt?: string | null,
  rawContent?: string | null
): ArticleSEOData {
  const cleanTitle = (title || "").trim();
  
  // 1. Meta Title (Target 50-60 chars)
  let meta_title = cleanTitle ? `${cleanTitle} | Voice of UPSA` : "";
  if (meta_title.length > 60) {
    meta_title = cleanTitle.slice(0, 57).trim() + "...";
  }

  // 2. Meta Description (Target 120-155 chars)
  let meta_description = "";
  if (excerpt && excerpt.trim() !== "") {
    meta_description = excerpt.trim();
  } else if (rawContent && rawContent.trim() !== "" && rawContent !== "<p></p>") {
    const stripped = rawContent.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    meta_description = stripped;
  }
  if (meta_description.length > 155) {
    meta_description = meta_description.slice(0, 152).trim() + "...";
  }

  // 3. Meta Keywords (Extract most meaningful terms)
  const sourceText = `${cleanTitle} ${excerpt || ""}`.toLowerCase();
  const words = sourceText.match(/[a-z0-9]+/g) || [];
  const keywordsMap: Record<string, number> = {};

  words.forEach((word) => {
    if (word.length >= 3 && !SEO_STOP_WORDS.has(word) && isNaN(Number(word))) {
      keywordsMap[word] = (keywordsMap[word] || 0) + 1;
    }
  });

  const sortedKeywords = Object.keys(keywordsMap)
    .sort((a, b) => keywordsMap[b] - keywordsMap[a])
    .slice(0, 8);

  if (sortedKeywords.length < 3 && cleanTitle) {
    if (!sortedKeywords.includes("upsa")) sortedKeywords.unshift("upsa");
    if (!sortedKeywords.includes("campus")) sortedKeywords.push("campus");
  }

  const meta_keywords = sortedKeywords.join(", ");

  return {
    meta_title,
    meta_description,
    meta_keywords,
  };
}
