import { z } from "zod";
import { SellerType, ProductCondition, PaymentMethod } from "./types";

export const CreateStoreSchema = z.object({
  name: z.string().min(2, "Store name must be at least 2 characters").max(50),
  description: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
});

export const ApplySellerSchema = z.object({
  seller_type: z.enum(['student', 'student_business', 'campus_business', 'external_approved']),
  full_name: z.string().min(2, "Full name is required").max(100),
  phone: z.string().min(10, "Valid phone number is required").max(15).transform(val => {
    const clean = val.replace(/\s+/g, "");
    if (clean.startsWith("0")) return "+233" + clean.slice(1);
    if (clean.startsWith("233")) return "+" + clean;
    return clean;
  }),
  index_number: z.string().max(20).optional(),
  student_id_url: z.string().url("Must be a valid URL").optional(),
  whatsapp_number: z.string().min(10, "WhatsApp number is required").max(15).transform(val => {
    const clean = val.replace(/\s+/g, "");
    if (clean.startsWith("0")) return "+233" + clean.slice(1);
    if (clean.startsWith("233")) return "+" + clean;
    return clean;
  }),
  business_name: z.string().max(100).optional(),
}).superRefine((data, ctx) => {
  // If they are a student or student business, they must provide their Student ID details
  if (data.seller_type === 'student' || data.seller_type === 'student_business') {
    if (!data.index_number || data.index_number.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Student ID / Index No. is required",
        path: ["index_number"],
      });
    }
    if (!data.student_id_url || data.student_id_url.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please upload your Student ID card",
        path: ["student_id_url"],
      });
    }
  }

  // If they are a student business, they must provide a business name
  if (data.seller_type === 'student_business') {
    if (!data.business_name || data.business_name.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business / Store Name is required",
        path: ["business_name"],
      });
    }
  }
});

export const CreateProductSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  name: z.string().min(3, "Product name must be at least 3 characters").max(100),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().int().min(1, "Price must be at least 1 GHS"),
  discount_price: z.coerce.number().int().optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'used']),
  stock_qty: z.coerce.number().int().min(1, "Stock must be at least 1"),
  image_urls: z.array(z.string().url()).min(1, "At least one image is required").max(5, "Maximum 5 images allowed"),
}).refine(data => {
  if (data.discount_price !== undefined) {
    return data.discount_price < data.price;
  }
  return true;
}, {
  message: "Discount price must be less than original price",
  path: ["discount_price"]
});

export const AddToCartSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(10), // Limit max items per transaction
});

export const CheckoutSchema = z.object({
  delivery_location_id: z.string().uuid(),
  payment_method: z.enum(['pay_on_delivery']),
  delivery_details: z.object({
    additional_info: z.string().optional(),
    contact_phone: z.string().min(10).max(15),
  }),
});
