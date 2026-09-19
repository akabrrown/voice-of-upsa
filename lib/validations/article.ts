import * as z from "zod";

export const articleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters."),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters.").max(300),
  content: z.string().min(50, "Content must be at least 50 characters."),
  cover_image_url: z.string().url("Please provide a valid image URL.").optional().or(z.literal("")),
  cover_image_alt: z.string().max(125, "Alt text must be under 125 characters.").optional().or(z.literal("")),
  category_id: z.string().uuid("Please select a category."),
  is_featured: z.boolean().default(false),
  is_pinned: z.boolean().default(false),
  allow_comments: z.boolean().default(true),
  meta_title: z.string().max(60, "Meta title must be under 60 characters.").optional().or(z.literal("")),
  meta_description: z.string().max(160, "Meta description must be under 160 characters.").optional().or(z.literal("")),
  meta_keywords: z.string().optional().or(z.literal("")),
  author_id: z.string().uuid().optional().nullable(),
  author_name: z.string().max(100, "Author name must be under 100 characters.").optional().or(z.literal("")),
  author_title: z.string().max(100, "Author title must be under 100 characters.").optional().or(z.literal("")),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
