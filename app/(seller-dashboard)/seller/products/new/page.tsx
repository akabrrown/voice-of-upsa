"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Upload, Plus, Trash2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  category_id: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "Price must be at least 1 GHS"),
  discount_price: z.coerce.number().optional().nullable(),
  stock_qty: z.coerce.number().int().min(0, "Stock cannot be negative"),
  condition: z.enum(["new", "like_new", "good", "fair", "used"]).default("new"),
});

type FormData = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const supabase = createClient();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      category_id: "",
      description: "",
      price: 0,
      discount_price: null,
      stock_qty: 1,
      condition: "new",
    },
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from("product_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (data && data.length > 0) {
          setCategories(data);
          setValue("category_id", data[0].id);
        } else {
          // Fallback categories if none seeded yet
          const fallback = [
            { id: "textbooks", name: "Textbooks & Handouts" },
            { id: "electronics", name: "Electronics & Gadgets" },
            { id: "fashion", name: "Clothing & Fashion" },
            { id: "services", name: "Student Services" },
            { id: "hostel_essentials", name: "Hostel Essentials" },
          ];
          setCategories(fallback);
          if (fallback.length > 0) setValue("category_id", fallback[0].id);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, [setValue, supabase]);

  const addImageUrl = () => {
    if (!newImageUrl.trim()) return;
    try {
      new URL(newImageUrl.trim());
      setImageUrls((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl("");
    } catch {
      toast.error("Please enter a valid image URL");
    }
  };

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated. Please sign in.");

      // Fetch or create the seller's store
      let { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!store) {
        // Create an automatic store for verified seller
        const storeSlug = `store-${user.id.slice(0, 8)}`;
        const { data: newStore, error: createStoreErr } = await supabase
          .from("stores")
          .insert({
            owner_id: user.id,
            name: "My Campus Store",
            slug: storeSlug,
          })
          .select("id")
          .single();

        if (createStoreErr) throw createStoreErr;
        store = newStore;
      }

      if (!store) throw new Error("Could not find or create a store for your account.");

      const generatedSlug = values.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40) + "-" + Math.random().toString(36).substring(2, 7);

      const discountPrice = values.discount_price && values.discount_price > 0 && values.discount_price < values.price
        ? Math.round(values.discount_price)
        : null;

      // Ensure category_id is a valid UUID or fallback category
      let categoryIdToInsert = values.category_id;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(categoryIdToInsert);
      
      if (!isUUID) {
        // Find or insert the category record in product_categories
        const { data: catRecord } = await supabase
          .from("product_categories")
          .select("id")
          .eq("slug", categoryIdToInsert)
          .maybeSingle();

        if (catRecord) {
          categoryIdToInsert = catRecord.id;
        } else {
          const { data: newCat } = await supabase
            .from("product_categories")
            .insert({
              name: categories.find(c => c.id === categoryIdToInsert)?.name || "General",
              slug: categoryIdToInsert,
            })
            .select("id")
            .single();
          if (newCat) categoryIdToInsert = newCat.id;
        }
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          store_id: store.id,
          category_id: categoryIdToInsert,
          slug: generatedSlug,
          name: values.name.trim(),
          description: values.description?.trim() || null,
          price: Math.round(values.price),
          discount_price: discountPrice,
          stock_qty: values.stock_qty,
          condition: values.condition,
          status: "approved", // Auto-approved for verified campus sellers
        })
        .select("id")
        .single();

      if (productError) throw productError;

      // Insert images if provided
      if (imageUrls.length > 0 && product) {
        const imageInserts = imageUrls.map((url, sort_order) => ({
          product_id: product.id,
          url,
          sort_order,
        }));

        await supabase.from("product_images").insert(imageInserts);
      }

      toast.success("Product published successfully to Campus Mart!");
      router.push("/seller/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/seller/products"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Add New Product</h1>
          <p className="text-gray-500 mt-1">List a new item for sale in your campus store.</p>
        </div>
      </div>

      <Card className="border border-gray-200 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">
                Product Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Business Law 3rd Edition Textbook"
                className="h-11"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>}
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watch("category_id")}
                  onValueChange={(val) => setValue("category_id", val)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-xs text-red-600 font-medium">{errors.category_id.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  Item Condition <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watch("condition")}
                  onValueChange={(val: any) => setValue("condition", val)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Brand New</SelectItem>
                    <SelectItem value="like_new">Like New (Barely used)</SelectItem>
                    <SelectItem value="good">Good (Normal wear)</SelectItem>
                    <SelectItem value="fair">Fair (Usable with flaws)</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price & Discount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  Regular Price (GHS) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="50"
                  className="h-11"
                  {...register("price")}
                />
                {errors.price && <p className="text-xs text-red-600 font-medium">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  Discount Price (Optional)
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="40"
                  className="h-11"
                  {...register("discount_price")}
                />
                <span className="text-[11px] text-gray-400">Must be lower than regular price</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  className="h-11"
                  {...register("stock_qty")}
                />
                {errors.stock_qty && <p className="text-xs text-red-600 font-medium">{errors.stock_qty.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900">Product Description</label>
              <Textarea 
                placeholder="Include specifications, edition, reason for selling, or campus pickup instructions..." 
                className="min-h-[120px] resize-none"
                {...register("description")} 
              />
            </div>

            {/* Image URLs */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="text-sm font-bold text-gray-900 flex items-center justify-between">
                <span>Product Images</span>
                <span className="text-xs font-normal text-gray-400">Add 1 or more image URLs</span>
              </label>

              <div className="flex gap-2">
                <Input
                  placeholder="Paste direct image URL (e.g. https://res.cloudinary.com/...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addImageUrl}
                  className="h-11 shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add
                </Button>
              </div>

              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 rounded-xl border border-gray-200 overflow-hidden group bg-gray-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-upsa-navy hover:bg-upsa-navy/90 text-white min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Product"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
