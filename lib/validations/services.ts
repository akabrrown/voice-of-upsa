import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  slug: z.string().min(2).max(50),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters"),
  slug: z.string().min(2).max(100),
  category_id: z.string().uuid("Invalid category ID"),
  description: z.string().optional(),
  location_label: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_whatsapp: z.string().optional(),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  hours: z.any().optional(), // Will store JSON like { "Monday": "9am - 5pm" }
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  is_featured: z.boolean().default(false),
  status: z.enum(["active", "inactive"]).default("inactive"),
});

export type CategoryInput = z.input<typeof categorySchema>;
export type ServiceInput = z.input<typeof serviceSchema>;
