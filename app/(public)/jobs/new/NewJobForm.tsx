"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitPosting } from "../actions";

const EMPTY_FORM = {
    title: "",
    category_id: "",
    organization_name: "",
    type: "full_time",
    location_type: "on_campus",
    location_label: "",
    description: "",
    requirements: "",
    compensation_type: "paid",
    compensation_details: "",
    apply_method: "link",
    apply_value: "",
    image_url: "",
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function NewJobForm({ categories, isAdminMode = false }: { categories: { id: string; name: string }[], isAdminMode?: boolean }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
    category_id: categories[0]?.id ?? "",
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError("Use a JPG, PNG or WEBP image.");
    } else if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 5MB or smaller.");
    } else {
      setIsUploading(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || typeof data.secure_url !== "string") {
          throw new Error(data.error || "Upload failed");
        }
        setFormData((prev) => ({ ...prev, image_url: data.secure_url }));
      } catch {
        setImageError("Could not upload the image. Try again.");
      } finally {
        setIsUploading(false);
      }
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploading) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await submitPosting(formData as Parameters<typeof submitPosting>[0]);
      if (result.ok) setSubmitted(true);
      else setErrorMessage(result.error);
    } catch {
      setErrorMessage("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 max-w-xl text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-[#1B2A4A] mb-4">Posting Submitted</h2>
          <p className="text-gray-600 mb-8">
            {isAdminMode ? (
              <>Your posting has been successfully created and is now live on the public board.</>
            ) : (
              <>Your posting has been successfully submitted and is now <span className="font-bold">Pending Review</span>. 
              Once an admin approves it, it will be visible on the public board.</>
            )}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={isAdminMode ? "/dashboard/admin/jobs" : "/jobs"}>
              <Button variant="outline" className="rounded-xl border-gray-200">
                {isAdminMode ? "Back to Admin Jobs" : "Back to Board"}
              </Button>
            </Link>
            <Button onClick={() => { setSubmitted(false); setFormData({ ...EMPTY_FORM, category_id: categories[0]?.id ?? "" }); }} className="bg-[#1F7A6C] hover:bg-[#155A4F] text-white rounded-xl">
              Post Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        <Link href={isAdminMode ? "/dashboard/admin/jobs" : "/jobs"} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-[#1B2A4A] mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isAdminMode ? "Back to Admin Jobs" : "Back to Jobs"}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#1B2A4A] tracking-tight mb-2">
            {isAdminMode ? "Create a Job Posting" : "Post an Opportunity"}
          </h1>
          <p className="text-gray-500">
            {isAdminMode 
              ? "Create a new job posting directly on the board." 
              : "Submit a job, internship, or gig. All postings are reviewed before going public."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 space-y-8">
          {errorMessage && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1B2A4A] border-b border-gray-100 pb-2">Basic Info</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Job Title *</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Graphic Design Intern" className="bg-gray-50 border-gray-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Organization Name *</label>
                <Input required value={formData.organization_name} onChange={e => setFormData({...formData, organization_name: e.target.value})} placeholder="e.g. UPSA SRC" className="bg-gray-50 border-gray-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type *</label>
                <select 
                  required 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="freelance">Freelance/Gig</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="job-category" className="text-sm font-medium text-gray-700">Category *</label>
                <select
                  id="job-category"
                  required
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1B2A4A] border-b border-gray-100 pb-2">Location & Compensation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location Type *</label>
                <select 
                  required 
                  value={formData.location_type} 
                  onChange={e => setFormData({...formData, location_type: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
                >
                  <option value="on_campus">On Campus</option>
                  <option value="accra">Accra</option>
                  <option value="remote">Remote</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Specific Location Label</label>
                <Input value={formData.location_label} onChange={e => setFormData({...formData, location_label: e.target.value})} placeholder="e.g. East Legon" className="bg-gray-50 border-gray-200" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Compensation Type *</label>
                <select 
                  required 
                  value={formData.compensation_type} 
                  onChange={e => setFormData({...formData, compensation_type: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="stipend">Stipend</option>
                  <option value="undisclosed">Undisclosed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Compensation Details</label>
                <Input value={formData.compensation_details} onChange={e => setFormData({...formData, compensation_details: e.target.value})} placeholder="e.g. GHS 1000 / month" className="bg-gray-50 border-gray-200" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1B2A4A] border-b border-gray-100 pb-2">Description</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Job Description *</label>
              <textarea 
                required 
                rows={5}
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the role and responsibilities..."
                className="flex w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Requirements *</label>
              <textarea 
                required 
                rows={4}
                value={formData.requirements} 
                onChange={e => setFormData({...formData, requirements: e.target.value})}
                placeholder="List skills, experience, or student status required..."
                className="flex w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1B2A4A] border-b border-gray-100 pb-2">How to Apply</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Application Method *</label>
                <select 
                  required 
                  value={formData.apply_method} 
                  onChange={e => setFormData({...formData, apply_method: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A6C]"
                >
                  <option value="link">External Link</option>
                  <option value="email">Email</option>
                  <option value="instructions">Text Instructions</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {formData.apply_method === 'link' ? 'URL Link *' : formData.apply_method === 'email' ? 'Email Address *' : 'Instructions *'}
                </label>
                <Input 
                  required 
                  value={formData.apply_value} 
                  onChange={e => setFormData({...formData, apply_value: e.target.value})} 
                  placeholder={formData.apply_method === 'link' ? 'https://...' : formData.apply_method === 'email' ? 'careers@example.com' : 'e.g. Call this number...'} 
                  className="bg-gray-50 border-gray-200" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1B2A4A] border-b border-gray-100 pb-2">Image (optional)</h2>
            <p className="text-sm text-gray-500">Add a logo, flyer, or poster. JPG, PNG or WEBP, up to 5MB.</p>
            {formData.image_url ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={formData.image_url} alt="Uploaded posting visual" className="max-h-64 rounded-2xl border border-gray-200 object-contain bg-gray-50" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setFormData({ ...formData, image_url: "" })}
                  className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#1B2A4A] text-white shadow hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="job-image"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 transition-colors hover:border-[#1F7A6C] hover:text-[#1F7A6C]"
              >
                {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
                <span className="font-medium">{isUploading ? "Uploading…" : "Click to choose an image"}</span>
              </label>
            )}
            <input
              ref={imageInputRef}
              id="job-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={isUploading}
              onChange={handleImageSelect}
            />
            {imageError && <p role="alert" className="text-sm text-red-600">{imageError}</p>}
          </div>

          <div className="pt-6 border-t border-gray-100">
            <Button disabled={isSubmitting || isUploading} type="submit" className="w-full md:w-auto md:px-12 bg-[#1F7A6C] hover:bg-[#155A4F] text-white rounded-xl py-6 text-lg font-bold shadow-md transition-all">
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> {isAdminMode ? "Publishing..." : "Submitting..."}</>
              ) : (
                isAdminMode ? "Publish Job" : "Submit for Review"
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
