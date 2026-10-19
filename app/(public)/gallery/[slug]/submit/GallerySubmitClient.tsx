"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitPhoto } from "@/app/actions/gallery";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CldUploadWidget } from "next-cloudinary";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

export function GallerySubmitClient({ albumId, albumSlug }: { albumId: string, albumSlug: string }) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUploadSuccess = (result: any) => {
    setImageUrl(result.info.secure_url);
    toast.success("Photo uploaded successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("Please upload a photo first.");
      return;
    }
    if (!consentConfirmed) {
      toast.error("You must confirm the consent statement.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("album_id", albumId);
    formData.append("image_url", imageUrl);
    formData.append("caption", caption);
    formData.append("consent_confirmed", consentConfirmed ? "true" : "false");

    const res = await submitPhoto(formData);
    
    if (res.success) {
      toast.success(res.message || "Submitted successfully");
      router.push(`/gallery/${albumSlug}`);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to submit photo");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0C1729] rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-white/10">
      <div className="mb-6">
        <Link href={`/gallery/${albumSlug}`} className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-upsa-navy dark:hover:text-upsa-gold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Album
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Upload Section */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-900 dark:text-white">Upload Photo</Label>
          <div className="text-sm text-gray-500 dark:text-slate-400 mb-2">Location data is automatically stripped from your photo for privacy.</div>
          
          {!imageUrl ? (
            <CldUploadWidget 
              uploadPreset="vou_gallery" // Will need to ensure this preset exists in Cloudinary
              onSuccess={handleUploadSuccess}
              options={{
                maxFiles: 1,
                clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                maxFileSize: 5000000, // 5MB
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:border-upsa-navy dark:hover:border-upsa-gold transition-colors group"
                >
                  <UploadCloud className="w-10 h-10 text-gray-400 dark:text-slate-500 group-hover:text-upsa-navy dark:group-hover:text-upsa-gold mb-3 transition-colors" />
                  <span className="text-sm font-medium text-gray-600 dark:text-slate-300 group-hover:text-upsa-navy dark:group-hover:text-upsa-gold">
                    Click to browse or drag and drop
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">JPG, PNG up to 5MB</span>
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10">
              <Image src={imageUrl} alt="Uploaded preview" fill className="object-contain" />
              <button 
                type="button"
                onClick={() => setImageUrl(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors backdrop-blur-md shadow-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Caption Section */}
        <div className="space-y-3">
          <Label htmlFor="caption" className="text-base font-semibold text-gray-900 dark:text-white">Caption (Optional)</Label>
          <Textarea 
            id="caption"
            placeholder="Tell us about this moment..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none rounded-xl dark:bg-slate-900 dark:border-white/10 dark:text-gray-200"
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-400 dark:text-slate-500 font-medium">{caption.length}/200</div>
        </div>

        {/* Consent Section */}
        <div className="bg-upsa-gold/10 dark:bg-upsa-gold/5 p-5 rounded-2xl border border-upsa-gold/20 dark:border-upsa-gold/30 flex items-start gap-4">
          <Checkbox 
            id="consent" 
            checked={consentConfirmed} 
            onCheckedChange={(c) => setConsentConfirmed(c === true)}
            className="mt-1"
          />
          <div className="grid gap-1.5">
            <Label htmlFor="consent" className="font-bold text-upsa-navy dark:text-upsa-gold cursor-pointer">
              Privacy & Consent Confirmation
            </Label>
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
              I took this photo (or have the right to share it) and everyone clearly identifiable in it is okay with it being shown publicly on Voice of UPSA.
            </p>
          </div>
        </div>

        {/* Submit */}
        <Button 
          type="submit" 
          disabled={!imageUrl || !consentConfirmed || isSubmitting}
          className="w-full h-12 text-base font-bold bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy hover:bg-upsa-navy/90 dark:hover:bg-upsa-gold/90 rounded-xl"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting for Review...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Submit Photo
            </>
          )}
        </Button>

        <p className="text-center text-xs text-gray-500 dark:text-slate-400 font-medium">
          Photos must be approved by the editorial team before appearing in the gallery.
        </p>
      </form>
    </div>
  );
}
