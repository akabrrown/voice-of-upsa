"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  stock_qty: z.coerce.number().int().min(0, "Stock cannot be negative"),
  condition: z.enum(["new", "used", "refurbished"]).default("new"),
});

type FormData = z.infer<typeof productSchema>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock_qty: 1,
      condition: "new",
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: store } = await supabase.from('stores').select('id').eq('owner_id', session.user.id).single();
      if (!store) throw new Error("Store not found");

      const { error } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name: values.name,
          description: values.description,
          price: values.price,
          stock_qty: values.stock_qty,
          condition: values.condition,
          status: 'pending',
        });

      if (error) throw error;
      
      toast.success("Product added successfully");
      router.push("/seller/products");
    } catch (error: any) {
      toast.error(error.message);
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
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground mt-1">List a new item for sale in your store.</p>
        </div>
      </div>

      <Card className="border-border/50 bg-white/5 backdrop-blur-md">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name</label>
              <Input placeholder="e.g., iPhone 13 Pro Max" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Describe your product in detail..." 
                className="min-h-[120px]"
                {...register("description")} 
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (GHS)</label>
                <Input type="number" step="0.01" {...register("price")} />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stock Quantity</label>
                <Input type="number" {...register("stock_qty")} />
                {errors.stock_qty && <p className="text-sm text-destructive">{errors.stock_qty.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border/30">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
