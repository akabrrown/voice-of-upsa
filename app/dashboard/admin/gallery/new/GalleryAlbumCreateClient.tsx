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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">Album Title</Label>
              <Input id="title" name="title" required placeholder="e.g. Freshers Akwaaba Night 2026" className="font-medium" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description (Optional)</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Details about the event..." 
                rows={4} 
                className="resize-none"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
              <Select name="category" defaultValue="events" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="academics">Academics</SelectItem>
                  <SelectItem value="campus_life">Campus Life</SelectItem>
                  <SelectItem value="clubs_societies">Clubs & Societies</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date" className="text-sm font-semibold">Event Date (Optional)</Label>
              <Input id="event_date" name="event_date" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">Status</Label>
              <Select name="status" defaultValue="draft" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Hidden)</SelectItem>
                  <SelectItem value="published">Published (Public)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 space-y-6">
          <h3 className="font-semibold text-gray-900">Settings & Flags</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-xl border border-gray-200/60">
              <Switch id="submissions_open" checked={submissionsOpen} onCheckedChange={setSubmissionsOpen} />
              <div className="grid gap-1">
                <Label htmlFor="submissions_open" className="font-semibold cursor-pointer">Open for Submissions</Label>
                <p className="text-xs text-gray-500 leading-relaxed">Allow students to upload photos to this album for editorial review.</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-gray-50 p-4 rounded-xl border border-gray-200/60">
              <Switch id="is_featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              <div className="grid gap-1">
                <Label htmlFor="is_featured" className="font-semibold cursor-pointer">Featured Album</Label>
                <p className="text-xs text-gray-500 leading-relaxed">Pin this album to the top of the gallery index.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-upsa-navy hover:bg-upsa-navy/90 text-white min-w-[120px]">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? "Saving..." : "Create Album"}
          </Button>
        </div>
      </form>
    </div>
  );
}
