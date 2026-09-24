"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Store, GraduationCap, Building, UploadCloud, CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { ApplySellerSchema } from "@/lib/marketplace/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

type SellerFormValues = z.infer<typeof ApplySellerSchema>;

export default function SellOnMartPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SellerFormValues>({
    resolver: zodResolver(ApplySellerSchema),
    defaultValues: {
      seller_type: "student",
      student_id_url: "",
    },
  });

  const sellerType = watch("seller_type");
  const studentIdUrl = watch("student_id_url");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (data.url) {
        setValue("student_id_url", data.url, { shouldValidate: true });
        toast.success("Student ID uploaded successfully!");
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: SellerFormValues) => {

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/mart/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit application");
      }

      router.push("/mart/seller/pending");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-upsa-navy text-white py-16 px-6 relative overflow-hidden">
        <div className="container max-w-3xl relative z-10 mx-auto text-center">
          <Store className="h-12 w-12 mx-auto mb-6 text-upsa-gold" />
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 uppercase">
            Become a Seller
          </h1>
          <p className="text-lg text-white/80 max-w-lg mx-auto leading-relaxed">
            Join Campus Mart and start selling to the UPSA community today. Fast, trusted, and zero commissions.
          </p>
        </div>
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      </div>

      {/* Main Form Area */}
      <div className="container max-w-3xl mx-auto px-6 py-12 -mt-8 relative z-20">
        <div className="bg-white border border-border/60 p-8 lg:p-12 shadow-sm rounded-none">
          <div className="mb-10 pb-6 border-b border-border/40">
            <h2 className="text-2xl font-extrabold text-upsa-navy uppercase tracking-widest">Application Details</h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">We verify all sellers to keep our community safe. Please provide accurate information.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm font-bold text-red-800">{errorMsg}</p>
              </div>
            )}

            {/* Seller Type */}
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-gray-500">I am applying as a...</Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className={`cursor-pointer border-2 p-6 transition-all ${
                    sellerType === "student"
                      ? "border-upsa-navy bg-upsa-navy/5"
                      : "border-border/60 hover:border-upsa-navy/50"
                  }`}
                  onClick={() => setValue("seller_type", "student")}
                >
                  <GraduationCap className={`mb-4 h-8 w-8 ${sellerType === "student" ? "text-upsa-navy" : "text-gray-400"}`} />
                  <h3 className={`font-extrabold text-lg mb-1 ${sellerType === "student" ? "text-upsa-navy" : "text-gray-700"}`}>Student Individual</h3>
                  <p className="text-xs font-medium text-gray-500">Selling personal items, books, or small side-hustles.</p>
                </div>
                
                <div
                  className={`cursor-pointer border-2 p-6 transition-all ${
                    sellerType === "student_business"
                      ? "border-upsa-navy bg-upsa-navy/5"
                      : "border-border/60 hover:border-upsa-navy/50"
                  }`}
                  onClick={() => setValue("seller_type", "student_business")}
                >
                  <Building className={`mb-4 h-8 w-8 ${sellerType === "student_business" ? "text-upsa-navy" : "text-gray-400"}`} />
                  <h3 className={`font-extrabold text-lg mb-1 ${sellerType === "student_business" ? "text-upsa-navy" : "text-gray-700"}`}>Student Business</h3>
                  <p className="text-xs font-medium text-gray-500">Running a formal business on campus.</p>
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-border/40" />

            {/* Business Details (Conditional) */}
            {sellerType === "student_business" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="business_name" className="text-xs font-bold uppercase tracking-widest text-upsa-navy">Business / Store Name</Label>
                  <Input id="business_name" {...register("business_name")} placeholder="e.g. Campus Kicks" className="rounded-none h-12 border-border/60 focus-visible:ring-0 focus-visible:border-upsa-navy" />
                  {errors.business_name && <p className="text-xs font-bold text-red-500">{errors.business_name.message}</p>}
                </div>
                <div className="h-px w-full bg-border/40" />
              </div>
            )}

            {/* Personal Details */}
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-widest text-upsa-navy">{sellerType === "student_business" ? "Owner's Full Name" : "Full Name"}</Label>
                  <Input id="full_name" {...register("full_name")} placeholder="e.g. John Doe" className="rounded-none h-12 border-border/60 focus-visible:ring-0 focus-visible:border-upsa-navy" />
                  {errors.full_name && <p className="text-xs font-bold text-red-500">{errors.full_name.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="index_number" className="text-xs font-bold uppercase tracking-widest text-upsa-navy">Student ID / Index No.</Label>
                  <Input id="index_number" {...register("index_number")} placeholder="e.g. 10XXXXXX" className="rounded-none h-12 border-border/60 focus-visible:ring-0 focus-visible:border-upsa-navy" />
                  <p className="text-xs font-medium text-gray-400">Required for student verification</p>
                  {errors.index_number && <p className="text-xs font-bold text-red-500">{errors.index_number.message}</p>}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-upsa-navy">Phone Number</Label>
                  <Input id="phone" {...register("phone")} placeholder="024XXXXXXX" className="rounded-none h-12 border-border/60 focus-visible:ring-0 focus-visible:border-upsa-navy" />
                  {errors.phone && <p className="text-xs font-bold text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="whatsapp_number" className="text-xs font-bold uppercase tracking-widest text-upsa-navy">WhatsApp Number</Label>
                  <Input id="whatsapp_number" {...register("whatsapp_number")} placeholder="024XXXXXXX" className="rounded-none h-12 border-border/60 focus-visible:ring-0 focus-visible:border-upsa-navy" />
                  {errors.whatsapp_number && <p className="text-xs font-bold text-red-500">{errors.whatsapp_number.message}</p>}
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-border/40" />

            {/* Verification Upload */}
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-widest text-upsa-navy">Student ID Upload</Label>
              <p className="text-sm text-gray-500 font-medium">Please upload a clear photo of your UPSA Student ID card. This helps us verify you are an active student since Campus Mart isn't linked to the central student database.</p>
              
              <div className="mt-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                
                {studentIdUrl ? (
                  <div className="relative border-2 border-emerald-500 bg-emerald-50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-16 relative bg-white border border-border/40 overflow-hidden">
                        <img src={studentIdUrl} alt="ID Preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" /> ID Uploaded Successfully
                        </p>
                        <button type="button" onClick={() => setValue("student_id_url", "")} className="text-xs font-bold text-red-500 hover:underline mt-1">Remove & Re-upload</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full border-2 border-dashed border-border/60 hover:border-upsa-navy hover:bg-upsa-navy/5 transition-all py-12 flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-upsa-navy animate-spin" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-gray-400" />
                    )}
                    <span className="text-sm font-bold text-upsa-navy">
                      {isUploading ? "Uploading image..." : "Click to upload Student ID"}
                    </span>
                    <span className="text-xs font-medium text-gray-400">JPG, PNG (Max 5MB)</span>
                  </button>
                )}
                {errors.student_id_url && <p className="text-xs font-bold text-red-500 mt-2">{errors.student_id_url.message}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-none bg-upsa-navy hover:bg-upsa-navy/90 text-white font-bold uppercase tracking-widest text-sm" disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Application...</>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
