"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function NewPodcastShowPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "campus_life",
    itunes_author: "Voice of UPSA",
    itunes_explicit: "false",
    cover_image_url: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    const formUpload = new FormData();
    formUpload.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formUpload,
      });

      const data = await res.json();
      if (data.success) {
        setFormData({...formData, cover_image_url: data.url});
        toast.success("Cover art uploaded successfully!");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (err) {
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/admin/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Podcast show created successfully!");
        router.push(`/dashboard/admin/podcasts/${data.data.id}`);
      } else {
        toast.error(data.error || "Failed to create show");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/admin/podcasts')} className="rounded-full border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-black text-upsa-navy dark:text-white tracking-tight">Create Podcast Show</h1>
          <p className="text-gray-500 dark:text-slate-400">Set up a new podcast channel/feed.</p>
        </div>
      </div>

      <Card className="border border-gray-100 dark:border-white/10 shadow-md bg-white dark:bg-[#0C1729]">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Show Details</CardTitle>
          <CardDescription className="text-gray-500 dark:text-slate-400">This information will appear in the RSS feed and podcast directories (Apple Podcasts, Spotify).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Show Title</Label>
              <Input 
                required 
                placeholder="e.g. UPSA Business Hour" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Show Description (Synopsis)</Label>
              <Textarea 
                required 
                className="h-32 bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500" 
                placeholder="What is this podcast about?"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectItem value="campus_life">Campus Life</SelectItem>
                    <SelectItem value="education">Education & Academics</SelectItem>
                    <SelectItem value="business">Business & Finance</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">Author / Host Name</Label>
                <Input 
                  required 
                  value={formData.itunes_author}
                  onChange={e => setFormData({...formData, itunes_author: e.target.value})}
                  className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">Explicit Content</Label>
                <Select value={formData.itunes_explicit} onValueChange={(val) => setFormData({...formData, itunes_explicit: val})}>
                  <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                    <SelectItem value="false">Clean (No Explicit Content)</SelectItem>
                    <SelectItem value="true">Explicit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-900 dark:text-white">Cover Art</Label>
                <div className="flex gap-4 items-center">
                  {formData.cover_image_url ? (
                    <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md border-2 border-dashed flex items-center justify-center bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-slate-500">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={isUploading}
                        className="cursor-pointer bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white file:text-gray-900 dark:file:text-white"
                      />
                      {isUploading && <Loader2 className="w-4 h-4 animate-spin text-upsa-navy dark:text-upsa-gold" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Recommended: Square image, at least 1400x1400px (required for Apple Podcasts). Max 5MB.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" className="text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => router.push('/dashboard/admin/podcasts')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-upsa-gold text-upsa-navy dark:text-upsa-navy hover:bg-yellow-500 font-bold">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Show
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
