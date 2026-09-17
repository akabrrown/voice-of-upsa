import { z } from "zod";

export const articleSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(50),
  excerpt: z.string().max(500).optional(),
  category_id: z.string().uuid(),
  cover_image_url: z.string().url().optional(),
  status: z.enum(["draft", "review", "published", "archived"]).default("draft"),
  is_featured: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
  meta_keywords: z.string().optional(),
});

export const commentSchema = z.object({
  article_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  parent_id: z.string().uuid().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

export const profileSchema = z.object({
  full_name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(500).optional(),
  social_links: z.record(z.string(), z.string().url()).optional(),
});
