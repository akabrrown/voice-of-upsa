"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Target, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SubmitAdPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTier = searchParams.get("tier") || "basic";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    contact_email: "",
    contact_phone: "",
    ad_tier: defaultTier,
    target_url: "",
    banner_image_url: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      const res = await fetch("/api/upload/public", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const result = await res.json();
      setFormData((prev) => ({ ...prev, banner_image_url: result.secure_url }));
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name || !formData.contact_email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/advertise/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit application");
      }

      setIsSuccess(true);
      toast.success("Advertisement request submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center py-12 px-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl mb-2">Request Submitted</CardTitle>
            <CardDescription className="text-base mb-8">
              Thank you for choosing to advertise with Voice of UPSA. Our team will review your request and get back to you shortly at {formData.contact_email}.
            </CardDescription>
            <Button onClick={() => router.push("/")} className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy">
              Return Home
            </Button>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-upsa-navy tracking-tight mb-2">Advertise with Us</h1>
            <p className="text-gray-500">Submit your request and reach the entire campus.</p>
          </div>

          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-upsa-gold" />
            <CardHeader className="px-8 pt-8 pb-6 bg-white">
              <CardTitle>Advertisement Details</CardTitle>
              <CardDescription>
                Fill out the form below. Required fields are marked with an asterisk (*).
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 bg-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <Label htmlFor="ad_tier">Advertising Tier *</Label>
                  <select
                    id="ad_tier"
                    name="ad_tier"
                    value={formData.ad_tier}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    <option value="basic">Basic (Sidebar Ad)</option>
                    <option value="standard">Standard (Leaderboard Ad)</option>
                    <option value="premium">Premium (Hero Banner & Social)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company / Organization *</Label>
                    <Input
                      id="company_name"
                      name="company_name"
                      placeholder="e.g. UPSA Debate Club"
                      value={formData.company_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      placeholder="e.g. contact@example.com"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      name="contact_phone"
                      type="tel"
                      placeholder="e.g. +233 50 123 4567"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_url">Target URL</Label>
                    <Input
                      id="target_url"
                      name="target_url"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={formData.target_url}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner Image</Label>
                  <div 
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 text-upsa-gold animate-spin mb-2" />
                        <span className="text-sm text-gray-500 font-medium">Uploading image...</span>
                      </div>
                    ) : formData.banner_image_url ? (
                      <div className="flex flex-col items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.banner_image_url} 
                          alt="Banner preview" 
                          className="max-h-32 object-contain mb-3 rounded-md shadow-sm"
                        />
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">Image uploaded successfully</span>
                        <span className="text-xs text-gray-400 mt-2 hover:underline">Click to change image</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                        <span className="text-sm font-bold text-upsa-navy mb-1">Click to upload banner image</span>
                        <span className="text-xs text-gray-400">JPG, PNG, GIF, WEBP up to 10MB</span>
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isUploading}
                  className="w-full py-6 text-sm font-bold rounded-xl bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors mt-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    "Submit Advertisement Request"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
