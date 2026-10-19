"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { categorySchema, type CategoryInput } from "@/lib/validations/services";
import { manageCategory } from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CategoryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      sort_order: 0,
      is_active: true,
    },
  });

  async function onSubmit(data: CategoryInput) {
    setIsSubmitting(true);
    try {
      await manageCategory(data);
      toast.success("Category added successfully");
      form.reset();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const currentSlug = form.getValues("slug");
    if (name && !currentSlug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      form.setValue("slug", generatedSlug);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-700 dark:text-slate-300">Category Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Dining"
          {...form.register("name")}
          onBlur={handleNameBlur}
          className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white dark:placeholder:text-slate-500"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="slug" className="text-gray-700 dark:text-slate-300">Slug *</Label>
        <Input
          id="slug"
          placeholder="dining"
          {...form.register("slug")}
          className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white dark:placeholder:text-slate-500"
        />
        {form.formState.errors.slug && (
          <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order" className="text-gray-700 dark:text-slate-300">Sort Order</Label>
        <Input
          id="sort_order"
          type="number"
          {...form.register("sort_order", { valueAsNumber: true })}
          className="dark:bg-[#060D1A] dark:border-white/10 dark:text-white"
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input 
          type="checkbox" 
          id="is_active" 
          className="h-4 w-4 rounded border-gray-300 dark:border-white/20 dark:bg-[#060D1A] text-upsa-navy dark:text-upsa-gold focus:ring-upsa-navy dark:focus:ring-upsa-gold"
          {...form.register("is_active")}
        />
        <Label htmlFor="is_active" className="cursor-pointer text-gray-700 dark:text-slate-300">Active (Visible)</Label>
      </div>

      <Button type="submit" className="w-full bg-upsa-navy text-white hover:bg-[#001f40] dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-upsa-gold/90 mt-4" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Category"
        )}
      </Button>
    </form>
  );
}
