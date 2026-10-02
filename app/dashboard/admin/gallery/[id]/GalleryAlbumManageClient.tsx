"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { moderatePhoto, updateAlbum, setAlbumCover } from "@/app/actions/gallery";
import { GalleryAlbum, PhotoWithAuthor } from "@/lib/gallery/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CldUploadWidget } from "next-cloudinary";
import { ArrowLeft, CheckCircle2, XCircle, Image as ImageIcon, UploadCloud, Settings, ListFilter, Trash2, Calendar, Star } from "lucide-react";
import { toast } from "react-hot-toast";

export function GalleryAlbumManageClient({ initialAlbum, initialPhotos }: { initialAlbum: GalleryAlbum, initialPhotos: PhotoWithAuthor[] }) {
  const [album, setAlbum] = useState<GalleryAlbum>(initialAlbum);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Forms
  const [submissionsOpen, setSubmissionsOpen] = useState(album.submissions_open);
  const [isFeatured, setIsFeatured] = useState(album.is_featured);

  const pendingPhotos = initialPhotos.filter(p => p.status === "pending_review");
  const approvedPhotos = initialPhotos.filter(p => p.status === "approved");

  const handleModerate = async (photoId: string, status: "approved" | "rejected") => {
    const res = await moderatePhoto(photoId, status);
    if (res.success) {
      toast.success(res.message || `Photo ${status}`);
    } else {
      toast.error(res.error || "Failed to moderate photo");
    }
  };

  const handleSetCover = async (photoId: string) => {
    const res = await setAlbumCover(album.id, photoId);
    if (res.success) {
      setAlbum({ ...album, cover_photo_id: photoId });
      toast.success("Cover photo updated");
    } else {
      toast.error(res.error || "Failed to set cover photo");
    }
  };

  const handleUploadAdminPhoto = async (result: any) => {
    const imageUrl = result.info.secure_url;
    // We can use a direct call to our API or reuse the submitPhoto server action but we have to ensure it creates as 'approved'.
    // Admin uploads skip review. We can just POST to an action.
    const formData = new FormData();
    formData.append("album_id", album.id);
    formData.append("image_url", imageUrl);
    formData.append("consent_confirmed", "true"); // Admins implicitly confirm
    
    // Instead of reusing submitPhoto, which is in another file, we can just call it since it checks isAdmin.
    const { submitPhoto } = await import("@/app/actions/gallery");
    const res = await submitPhoto(formData);
    
    if (res.success) {
      toast.success("Photo added to album");
      // Since it's server action with revalidatePath, page should refresh or we can refresh router
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to add photo");
    }
  };

  const handleUpdateAlbum = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("submissions_open", submissionsOpen ? "true" : "false");
    formData.append("is_featured", isFeatured ? "true" : "false");

    const res = await updateAlbum(album.id, formData);
    
    if (res.success) {
      toast.success("Album updated successfully");
    } else {
      toast.error(res.error || "Failed to update album");
    }
    setIsUpdating(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/admin/gallery" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-upsa-navy mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Gallery
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{album.title}</h1>
              {album.status === 'published' ? (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
              ) : (
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Draft</span>
              )}
            </div>
            <p className="text-gray-500 flex items-center gap-3">
              <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {album.event_date ? new Date(album.event_date).toLocaleDateString() : 'No date'}</span>
              <span>•</span>
              <span className="uppercase tracking-wider text-xs font-semibold">{album.category.replace('_', ' ')}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <CldUploadWidget 
              uploadPreset="vou_gallery"
              onSuccess={handleUploadAdminPhoto}
              options={{ maxFiles: 5, clientAllowedFormats: ["jpg", "jpeg", "png", "webp"] }}
            >
              {({ open }) => (
                <Button onClick={() => open()} className="bg-upsa-navy hover:bg-upsa-navy/90 text-white">
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
              )}
            </CldUploadWidget>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="mb-8 bg-white border border-gray-200 rounded-xl p-1 h-auto w-full md:w-auto overflow-x-auto justify-start md:justify-center flex-nowrap shrink-0">
          <TabsTrigger value="photos" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-lg px-6 py-2.5">
            <ImageIcon className="w-4 h-4 mr-2" />
            Live Photos <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{approvedPhotos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-lg px-6 py-2.5">
            <ListFilter className="w-4 h-4 mr-2" />
            Moderation Queue 
            {pendingPhotos.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">{pendingPhotos.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 rounded-lg px-6 py-2.5">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* LIVE PHOTOS TAB */}
        <TabsContent value="photos">
          {approvedPhotos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">No live photos</p>
              <p className="text-gray-500 text-sm mt-1">Upload photos or approve student submissions to populate this album.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {approvedPhotos.map(photo => (
                <div key={photo.id} className={`group relative rounded-xl overflow-hidden border-2 ${album.cover_photo_id === photo.id ? 'border-upsa-gold ring-2 ring-upsa-gold/20' : 'border-gray-200'}`}>
                  <div className="aspect-[4/3] relative">
                    <Image src={photo.image_url} alt="" fill className="object-cover" />
                  </div>
                  
                  {album.cover_photo_id === photo.id && (
                    <div className="absolute top-2 left-2 bg-upsa-gold text-upsa-navy text-xs font-bold px-2 py-1 rounded shadow-sm flex items-center">
                      <Star className="w-3 h-3 mr-1" /> Cover
                    </div>
                  )}

                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => handleModerate(photo.id, "rejected")} title="Remove Photo">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      {album.cover_photo_id !== photo.id && (
                        <Button variant="secondary" size="sm" className="text-xs" onClick={() => handleSetCover(photo.id)}>
                          Set as Cover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MODERATION TAB */}
        <TabsContent value="moderation">
          {pendingPhotos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Queue is clear</p>
              <p className="text-gray-500 text-sm mt-1">There are no pending submissions for this album.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                <ListFilter className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Review Queue</p>
                  <p className="text-sm opacity-90 mt-1">These photos were submitted by students. Approving them will make them immediately visible in the public gallery.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPhotos.map(photo => (
                  <div key={photo.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm flex flex-col">
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <Image src={photo.image_url} alt="" fill className="object-contain" />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        {photo.caption && <p className="text-sm text-gray-900 mb-2 italic">&quot;{photo.caption}&quot;</p>}
                        <p className="text-xs text-gray-500">Submitted by: <span className="font-medium text-gray-900">{photo.profiles?.full_name || 'Unknown'}</span></p>
                        <p className="text-xs text-gray-500">Date: {new Date(photo.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 w-full pt-4 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleModerate(photo.id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-2" /> Reject
                        </Button>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleModerate(photo.id, "approved")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 max-w-3xl">
            <form onSubmit={handleUpdateAlbum} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Album Title</Label>
                  <Input id="title" name="title" required defaultValue={album.title} className="font-medium" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={album.description || ""}
                    rows={4} 
                    className="resize-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
                  <Select name="category" defaultValue={album.category} required>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                  <Label htmlFor="event_date" className="text-sm font-semibold">Event Date</Label>
                  <Input id="event_date" name="event_date" type="date" defaultValue={album.event_date || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">Status</Label>
                  <Select name="status" defaultValue={album.status} required>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (Hidden)</SelectItem>
                      <SelectItem value="published">Published (Public)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-4">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="grid gap-1">
                    <Label htmlFor="submissions_open" className="font-semibold cursor-pointer">Open for Submissions</Label>
                    <p className="text-xs text-gray-500">Allow students to upload photos to this album.</p>
                  </div>
                  <Switch id="submissions_open" checked={submissionsOpen} onCheckedChange={setSubmissionsOpen} />
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="grid gap-1">
                    <Label htmlFor="is_featured" className="font-semibold cursor-pointer">Featured Album</Label>
                    <p className="text-xs text-gray-500">Pin this album to the top of the gallery.</p>
                  </div>
                  <Switch id="is_featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isUpdating} className="bg-upsa-navy hover:bg-upsa-navy/90 text-white min-w-[120px]">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
