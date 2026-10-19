"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft, Plus, Trash2 } from "lucide-react";
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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const supabase = createClient();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
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
    async function loadData() {
      try {
        // Load categories
        const { data: catData } = await supabase
          .from("product_categories")
          .select("id, name")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        const cats = catData && catData.length > 0 ? catData : [
          { id: "textbooks", name: "Textbooks & Handouts" },
          { id: "electronics", name: "Electronics & Gadgets" },
          { id: "fashion", name: "Clothing & Fashion" },
          { id: "services", name: "Student Services" },
          { id: "hostel_essentials", name: "Hostel Essentials" },
        ];
        setCategories(cats);

        // Load product
        if (productId) {
          const { data: product, error: prodErr } = await supabase
            .from("products")
            .select(`
              *,
              images:product_images(url)
            `)
            .eq("id", productId)
            .single();

          if (prodErr || !product) {
            toast.error("Product not found");
            router.push("/seller/products");
            return;
          }

          reset({
            name: product.name,
            category_id: product.category_id || cats[0]?.id,
            description: product.description || "",
            price: product.price || 0,
            discount_price: product.discount_price || null,
            stock_qty: product.stock_qty ?? 1,
            condition: product.condition || "new",
          });

          if (product.images && product.images.length > 0) {
            setImageUrls(product.images.map((img: any) => img.url));
          }
        }
      } catch (err: any) {
        console.error("Failed to load product for editing:", err);
        toast.error("Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [productId, reset, router, supabase]);

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
      const discountPrice = values.discount_price && values.discount_price > 0 && values.discount_price < values.price
        ? Math.round(values.discount_price)
        : null;

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: values.name.trim(),
          category_id: values.category_id,
          description: values.description?.trim() || null,
          price: Math.round(values.price),
          discount_price: discountPrice,
          stock_qty: values.stock_qty,
          condition: values.condition,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);

      if (updateError) throw updateError;

      // Update images: delete old and re-insert
      await supabase.from("product_images").delete().eq("product_id", productId);
      if (imageUrls.length > 0) {
        const imageInserts = imageUrls.map((url, sort_order) => ({
          product_id: productId,
          url,
          sort_order,
        }));
        await supabase.from("product_images").insert(imageInserts);
      }

      toast.success("Product updated successfully!");
      router.push("/seller/products");
    } catch (err: any) {
      console.error("Failed to update product:", err);
      toast.error(err.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full dark:hover:bg-white/10">
          <Link href="/seller/products"><ArrowLeft className="h-5 w-5 dark:text-white" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Product</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Update details, pricing, and stock for your listing.</p>
        </div>
      </div>

      <Card className="border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1729] shadow-sm rounded-2xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 dark:text-gray-200">
                Product Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Product Name"
                className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>}
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watch("category_id")}
                  onValueChange={(val) => setValue("category_id", val)}
                >
                  <SelectTrigger className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#0C1729] dark:border-white/10 dark:text-white">
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
                <label className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  Item Condition <span className="text-red-500">*</span>
                </label>
                <Select
                  value={watch("condition")}
                  onValueChange={(val: any) => setValue("condition", val)}
                >
                  <SelectTrigger className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white">
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#0C1729] dark:border-white/10 dark:text-white">
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
                <label className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  Regular Price (GHS) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                  {...register("price")}
                />
                {errors.price && <p className="text-xs text-red-600 font-medium">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  Discount Price (Optional)
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                  {...register("discount_price")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900 dark:text-gray-200">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
                  {...register("stock_qty")}
                />
                {errors.stock_qty && <p className="text-xs text-red-600 font-medium">{errors.stock_qty.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 dark:text-gray-200">Product Description</label>
              <Textarea 
                placeholder="Product description..." 
                className="min-h-[120px] resize-none dark:bg-[#060D1A] dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
                {...register("description")} 
              />
            </div>

            {/* Image URLs */}
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-white/10">
              <label className="text-sm font-bold text-gray-900 dark:text-gray-200 flex items-center justify-between">
                <span>Product Images</span>
                <span className="text-xs font-normal text-gray-400">Add 1 or more image URLs</span>
              </label>

              <div className="flex gap-2">
                <Input
                  placeholder="Paste direct image URL"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="h-11 dark:bg-[#060D1A] dark:border-white/10 dark:text-white dark:placeholder:text-gray-500"
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
                  className="h-11 shrink-0 dark:border-white/10 dark:hover:bg-white/5 dark:text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add
                </Button>
              </div>

              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden group bg-gray-50 dark:bg-slate-800"
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
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="dark:border-white/10 dark:hover:bg-white/5 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-upsa-navy dark:bg-upsa-gold hover:bg-upsa-navy/90 dark:hover:bg-upsa-gold/90 text-white dark:text-upsa-navy font-bold min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
