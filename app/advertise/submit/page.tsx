"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, CheckCircle2, Info, Lock, ShieldAlert, ImageIcon, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { FormShadowLoader } from "@/components/ui/shadow-loaders";

export default function AdSubmissionPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Suspense fallback={
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-upsa-navy border-t-transparent" />
                <p className="text-xs text-gray-400 mt-3 font-medium">Loading submission form...</p>
              </div>
            }>
              <AdSubmissionForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function AdSubmissionForm() {
  const searchParams = useSearchParams();
  const initialTier = searchParams.get("tier") || "basic";

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form Fields State
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [adType, setAdType] = useState<"leaderboard" | "sidebar" | "in-feed">("sidebar");
  const [packageTier, setPackageTier] = useState<string>(initialTier || "basic");
  const [targetUrl, setTargetUrl] = useState("");
  const [availableTiers, setAvailableTiers] = useState<any[]>([
    { id: "basic", name: "Basic Plan", price: 200, period: "per week" },
    { id: "standard", name: "Standard Plan", price: 500, period: "per week" },
    { id: "premium", name: "Premium Plan", price: 1200, period: "per week" },
  ]);
  
  // Ad Banner Creative Upload State
  const [creativeUrl, setCreativeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const supabase = createClient();

  // Load tiers from database
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_tiers")
          .select("id, name, price, period")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });
        if (data && data.length > 0) {
          setAvailableTiers(data);
          const found = data.find((t: any) => t.id === initialTier || t.name?.toLowerCase() === initialTier?.toLowerCase());
          if (found) {
            setPackageTier(found.id);
          }
        }
      } catch (err) {
        console.error("Error loading pricing tiers in ad form:", err);
      }
    };
    fetchTiers();
  }, [supabase, initialTier]);

  // Authentication status check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          setContactEmail(user.email || "");
          setContactName(user.user_metadata?.full_name || "");
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuth();
  }, [supabase]);

  // Handle pre-selected tier from pricing page
  useEffect(() => {
    if (initialTier) {
      setPackageTier(initialTier);
      if (initialTier === "standard" || initialTier === "premium") {
        setAdType("leaderboard");
      }
    }
  }, [initialTier]);

  // Handle Banner Image Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit!");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading ad creative banner...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.secure_url) {
        setCreativeUrl(data.secure_url);
        toast.success("Ad creative uploaded successfully!", { id: toastId });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload banner error:", err);
      toast.error("Creative upload failed. Please try again.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Ad Campaign to Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please login to submit advertisements!");
      return;
    }

    if (!creativeUrl) {
      toast.error("Please upload an ad banner creative!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/ads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          contact_name: contactName,
          contact_email: contactEmail,
          product_name: productName,
          product_description: productDescription,
          ad_type: adType,
          target_url: targetUrl,
          package_tier: packageTier,
          creative_url: creativeUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit advertisement.");
      }

      toast.success("Advertisement campaign submitted successfully!");
      setStep(2);
    } catch (err: any) {
      console.error("Error submitting advertisement:", err);
      toast.error(err.message || "Failed to submit advertisement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="py-12 max-w-2xl mx-auto">
        <FormShadowLoader />
      </div>
    );
  }

  // Guest Locked State
  if (!currentUser) {
    return (
      <Card className="border border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white p-8 text-center max-w-xl mx-auto">
        <div className="relative h-16 w-16 rounded-xl bg-upsa-gold/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="h-8 w-8 text-upsa-navy" />
          <ShieldAlert className="h-4 w-4 text-upsa-gold absolute -bottom-1 -right-1" />
        </div>
        
        <h2 className="text-2xl font-black text-upsa-navy mb-3 tracking-tight">Sign In Required</h2>
        
        <p className="text-gray-500 leading-relaxed text-xs mb-8 max-w-md mx-auto">
          To submit promotional campaigns, upload banners, and track impressions on Voice of UPSA, an authenticated account is required.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-5 text-xs font-bold rounded-xl transition-all shadow-sm">
            <Link href={`/auth/login?redirect=/advertise/submit?tier=${initialTier}`}>
              Sign In <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-gray-200 text-upsa-navy hover:bg-gray-50 py-5 text-xs font-bold rounded-xl transition-all">
            <Link href="/auth/register">
              Create Account
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {step === 1 ? (
        <Card className="border border-gray-100 shadow-xl rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-upsa-navy text-white p-8 sm:p-10 text-center relative">
            <div className="absolute top-4 right-4 bg-white/10 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
              <CheckCircle2 className="h-3 w-3 text-upsa-gold" /> Signed In
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight uppercase">Submit Campaign</CardTitle>
            <p className="text-gray-300 mt-2 text-xs sm:text-sm max-w-md mx-auto">
              Provide campaign details, schedule, and banner assets for editorial review.
            </p>
          </CardHeader>
          
          <CardContent className="p-8 sm:p-12 bg-white">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Brand & Contact Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-upsa-navy uppercase tracking-widest border-b pb-2 mb-4">
                  1. Brand & Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company" className="font-bold text-upsa-navy text-xs uppercase">Company / Organization</Label>
                    <Input 
                      id="company" 
                      placeholder="e.g. MTN Ghana or campus business" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required 
                      className="rounded-xl border-gray-200 focus:border-upsa-navy py-5 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="font-bold text-upsa-navy text-xs uppercase">Contact Person Name</Label>
                    <Input 
                      id="contact" 
                      placeholder="Your Full Name" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required 
                      className="rounded-xl border-gray-200 focus:border-upsa-navy py-5 text-sm"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="font-bold text-upsa-navy text-xs uppercase">Contact Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="contact@company.com" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required 
                      className="rounded-xl border-gray-200 focus:border-upsa-navy py-5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Product Details Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-upsa-navy uppercase tracking-widest border-b pb-2 mb-4">
                  2. Product & Campaign Details
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_name" className="font-bold text-upsa-navy text-xs uppercase">Product / Service Name</Label>
                    <Input 
                      id="product_name" 
                      placeholder="e.g. Fast Campus Delivery App or Smart Stationery" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required 
                      className="rounded-xl border-gray-200 focus:border-upsa-navy py-5 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_desc" className="font-bold text-upsa-navy text-xs uppercase">Product / Campaign Description</Label>
                    <Textarea 
                      id="product_desc" 
                      placeholder="Briefly describe the product, service, or event you are promoting and who it is targetting." 
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      required 
                      className="rounded-xl border-gray-200 focus:border-upsa-navy min-h-[100px] p-4 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_url" className="font-bold text-upsa-navy text-xs uppercase">Destination URL (Target Link)</Label>
                    <Input 
                      id="target_url" 
                      type="url"
                      placeholder="https://your-website.com or social page link" 
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      required 
                      className="rounded-xl border-gray-200 focus:border-upsa-navy py-5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Plans & Placements */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-upsa-navy uppercase tracking-widest border-b pb-2 mb-4">
                  3. Subscription Plans & Ad Zone
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-upsa-navy text-xs uppercase">Selected Subscription Plan</Label>
                    <Select 
                      value={packageTier} 
                      onValueChange={(val) => setPackageTier(val as any)}
                    >
                      <SelectTrigger className="rounded-xl border-gray-200">
                        <SelectValue placeholder="Select Pricing Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.name || tier.id} (GH₵ {Number(tier.price).toLocaleString()}{tier.period ? ` / ${tier.period}` : ""})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-upsa-navy text-xs uppercase">Ad Placement Unit</Label>
                    <Select 
                      value={adType} 
                      onValueChange={(val) => setAdType(val as any)}
                    >
                      <SelectTrigger className="rounded-xl border-gray-200">
                        <SelectValue placeholder="Select Ad Zone Placement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sidebar">Sidebar Placement (300x250)</SelectItem>
                        <SelectItem value="leaderboard">Leaderboard Placement (728x90)</SelectItem>
                        <SelectItem value="in-feed">In-Feed Native Placement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Ad Banner Creative */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-upsa-navy uppercase tracking-widest border-b pb-2 mb-4">
                  4. Ad Creative Banner Banner
                </h3>

                <div className="space-y-2">
                  <Label className="font-bold text-upsa-navy text-xs uppercase">Ad Banner Creative</Label>
                  
                  {creativeUrl ? (
                    <div className="relative border-2 border-green-200 rounded-2xl overflow-hidden bg-gray-50 p-4 flex flex-col items-center">
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm max-w-md bg-white">
                        <Image
                          src={creativeUrl}
                          alt="Banner Preview"
                          fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between w-full max-w-md border-t pt-3">
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Ready to Submit
                        </span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setCreativeUrl("")}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove Creative
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-upsa-navy border-t-transparent mb-2" />
                          <span className="text-sm font-bold text-gray-500">Uploading banner to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-300 mb-2" />
                          <span className="text-sm font-bold text-gray-500">Click to upload ad banner</span>
                          <span className="text-xs text-gray-400 mt-1">Maximum size: 5MB (JPG, PNG, GIF)</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Information Banner */}
              <div className="p-4 bg-upsa-gold/10 rounded-xl flex items-start space-x-3 border border-upsa-gold/20">
                <Info className="h-5 w-5 text-upsa-navy shrink-0 mt-0.5" />
                <p className="text-xs text-upsa-navy/80 leading-relaxed font-medium">
                  Your campaign details and ad banner will be audited by the Voice of UPSA editorial board before going live. 
                  Once approved, we will send an email invoice with convenient mobile money or card checkout directions.
                </p>
              </div>

              {/* Submit CTA */}
              <Button 
                type="submit" 
                className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-5 text-sm font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? "Submitting Campaign..." : "Submit Campaign for Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-xl p-8 sm:p-12">
          <div className="bg-emerald-50 p-4 inline-block rounded-2xl mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-upsa-navy mb-3 tracking-tight uppercase">Campaign Submitted</h2>
          
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed mb-8 text-xs sm:text-sm">
            Thank you for partnering with Voice of UPSA. Your promotional campaign has been logged. 
            Our marketing team will review your creative elements, products, and contact details and reach out within 24 hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-upsa-navy text-white font-bold px-6 py-4 rounded-xl shadow-sm hover:bg-upsa-gold hover:text-upsa-navy transition-colors text-xs">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-200 text-upsa-navy font-bold px-6 py-4 rounded-xl hover:bg-gray-50 transition-colors text-xs">
              <Link href="/advertise">View Ad Packages</Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
