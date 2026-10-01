"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { serviceSchema, type ServiceInput } from "@/lib/validations/services";
import { createService, updateService } from "@/lib/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceFormProps {
  initialData?: ServiceInput & { id: string };
  categories: { id: string; name: string }[];
}

export function ServiceForm({ initialData, categories }: ServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      category_id: "",
      location_label: "",
      contact_phone: "",
      contact_email: "",
      website_url: "",
      logo_url: "",
      contact_whatsapp: "",
      status: "inactive",
      is_featured: false,
      hours: "",
    },
  });

  async function onSubmit(data: ServiceInput) {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        await updateService(initialData.id, data);
        toast.success("Service updated successfully");
      } else {
        await createService(data);
        toast.success("Service created successfully");
      }
      router.push("/dashboard/admin/services");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Generate a slug from name if empty
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

  const logoUrl = form.watch("logo_url");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      form.setValue("logo_url", data.url, { shouldValidate: true });
      toast.success("Logo uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Campus Clinic"
                {...form.register("name")}
                onBlur={handleNameBlur}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <Input
                id="slug"
                placeholder="campus-clinic"
                {...form.register("slug")}
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <Label>Category *</Label>
            <Select 
              value={form.watch("category_id")} 
              onValueChange={(val) => form.setValue("category_id", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.category_id && (
              <p className="text-sm text-red-500">{form.formState.errors.category_id.message}</p>
            )}
          </div>

            <div className="space-y-2 mb-4">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="What does this service provide?"
                className="min-h-[100px]"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Service Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative h-20 w-20 rounded-full overflow-hidden border border-gray-200">
                    <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => form.setValue("logo_url", "")}
                      className="absolute top-0 right-0 bg-white/80 p-1 rounded-bl text-red-500 hover:bg-white z-10"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="logo_upload" className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 text-center flex items-center gap-2 max-w-fit">
                    {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isUploading ? "Uploading..." : "Upload Logo"}
                  </Label>
                  <Input
                    id="logo_upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-500">Square image recommended. Max 2MB.</p>
                </div>
              </div>
              {form.formState.errors.logo_url && (
                <p className="text-sm text-red-500">{form.formState.errors.logo_url.message}</p>
              )}
            </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Contact & Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location_label">Location / Building</Label>
              <Input
                id="location_label"
                placeholder="e.g. LBC Block, Ground Floor"
                {...form.register("location_label")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Phone Number(s)</Label>
              <Input
                id="contact_phone"
                placeholder="e.g. 024..., 050... (separate with commas)"
                {...form.register("contact_phone")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email Address</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="e.g. clinic@upsa.edu.gh"
                {...form.register("contact_email")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_whatsapp">WhatsApp Number</Label>
              <Input
                id="contact_whatsapp"
                placeholder="e.g. +233 24..."
                {...form.register("contact_whatsapp")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                placeholder="https://..."
                {...form.register("website_url")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hours">Operating Hours</Label>
              <Input
                id="hours"
                placeholder="e.g. Mon-Fri, 9am - 5pm"
                {...form.register("hours" as any)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Status & Display</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={form.watch("status")} 
                onValueChange={(val: any) => form.setValue("status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Visible to public)</SelectItem>
                  <SelectItem value="inactive">Inactive (Hidden)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-3 pt-6">
              <input 
                type="checkbox" 
                id="is_featured" 
                className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy"
                {...form.register("is_featured")}
              />
              <Label htmlFor="is_featured" className="cursor-pointer">Feature this service (shows at top of directory)</Label>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/admin/services">Cancel</Link>
        </Button>
        <Button type="submit" className="bg-upsa-navy text-white hover:bg-[#001f40]" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Service"
          )}
        </Button>
      </div>
    </form>
  );
}
