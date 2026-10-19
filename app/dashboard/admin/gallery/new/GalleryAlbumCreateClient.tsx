"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAlbum } from "@/app/actions/gallery";
import { GalleryAlbumCategory, GalleryAlbumStatus } from "@/lib/gallery/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

export function GalleryAlbumCreateClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("submissions_open", submissionsOpen ? "true" : "false");
    formData.append("is_featured", isFeatured ? "true" : "false");

    const res = await createAlbum(formData);
    
    if (res.success && res.data) {
      toast.success(res.message || "Album created");
      router.push(`/dashboard/admin/gallery/${res.data.id}`);
    } else {
      toast.error(res.error || "Failed to create album");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0C1729] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-900 dark:text-white">Album Title</Label>
              <Input 
                id="title" 
                name="title" 
                required 
                placeholder="e.g. Freshers Akwaaba Night 2026" 
                className="font-medium bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900 dark:text-white">Description (Optional)</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Details about the event..." 
                rows={4} 
                className="resize-none bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold text-gray-900 dark:text-white">Category</Label>
              <Select name="category" defaultValue="events" required>
                <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="academics">Academics</SelectItem>
                  <SelectItem value="campus_life">Campus Life</SelectItem>
                  <SelectItem value="clubs_societies">Clubs & Societies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date" className="text-sm font-semibold text-gray-900 dark:text-white">Event Date (Optional)</Label>
              <Input 
                id="event_date" 
                name="event_date" 
                type="date" 
                className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-gray-900 dark:text-white">Status</Label>
              <Select name="status" defaultValue="draft" required>
                <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                  <SelectItem value="draft">Draft (Hidden)</SelectItem>
                  <SelectItem value="published">Published (Public)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-8 space-y-6">
          <h3 className="font-semibold text-gray-900 dark:text-white">Settings & Flags</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200/60 dark:border-white/10">
              <Switch id="submissions_open" checked={submissionsOpen} onCheckedChange={setSubmissionsOpen} />
              <div className="grid gap-1">
                <Label htmlFor="submissions_open" className="font-semibold text-gray-900 dark:text-white cursor-pointer">Open for Submissions</Label>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">Allow students to upload photos to this album for editorial review.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200/60 dark:border-white/10">
              <Switch id="is_featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <div className="grid gap-1">
                <Label htmlFor="is_featured" className="font-semibold text-gray-900 dark:text-white cursor-pointer">Featured Album</Label>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">Pin this album to the top of the gallery index.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-white/10 pt-6">
          <Button type="button" variant="outline" className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-upsa-navy hover:bg-upsa-navy/90 text-white min-w-[120px] dark:bg-upsa-gold dark:text-gray-950 dark:hover:bg-upsa-gold/90">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Create Album"}
          </Button>
        </div>
      </form>
    </div>
  );
}
