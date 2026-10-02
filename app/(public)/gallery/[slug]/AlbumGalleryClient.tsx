"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoWithAuthor } from "@/lib/gallery/types";
import { X, ChevronLeft, ChevronRight, Flag, AlertTriangle, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

export function AlbumGalleryClient({ photos, albumId, submissionsOpen }: { photos: PhotoWithAuthor[], albumId: string, submissionsOpen: boolean }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reportPhotoId, setReportPhotoId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>("no_consent");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const activePhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % photos.length);
    }
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportPhotoId) return;

    setIsSubmittingReport(true);
    // Use the shared report functionality (needs an action, we'll mock it for a second)
    // We will call submitReport server action.
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'gallery_photo',
          entity_id: reportPhotoId,
          reason: reportReason,
          details: reportDetails
        })
      });

      if (res.ok) {
        toast.success("Report submitted successfully. Our team will review it shortly.");
        setReportPhotoId(null);
        setReportDetails("");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit report.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
        <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {submissionsOpen 
            ? "Be the first to submit a photo for this album!"
            : "The editorial team hasn't added photos to this album yet."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {photos.map((photo, i) => (
          <div 
            key={photo.id} 
            className="break-inside-avoid relative group cursor-zoom-in rounded-xl overflow-hidden shadow-sm border border-gray-200/50 bg-gray-100 transition-all hover:shadow-xl hover:border-upsa-gold/50"
            onClick={() => setLightboxIndex(i)}
          >
            {/* Aspect ratio could be varied if we used masonry properly, Next Image requires width/height or fill */}
            <Image
              src={photo.image_url}
              alt={photo.caption || "Campus photo"}
              width={600}
              height={800} // Estimate or we could load original aspect ratio
              className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              {photo.caption && (
                <p className="text-white text-sm font-medium line-clamp-2 shadow-sm mb-2">{photo.caption}</p>
              )}
              {photo.profiles?.full_name && (
                <p className="text-gray-300 text-xs flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  {photo.profiles.full_name}
                </p>
              )}
            </div>
            {/* Report Button */}
            <button 
              onClick={(e) => { e.stopPropagation(); setReportPhotoId(photo.id); }}
              className="absolute top-3 right-3 bg-black/40 hover:bg-red-600/90 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm"
              title="Report photo"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && activePhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center">
          {/* Controls */}
          <button 
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button 
            onClick={prevPhoto}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={nextPhoto}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          <button 
            onClick={() => { setReportPhotoId(activePhoto.id); setLightboxIndex(null); }}
            className="absolute top-6 left-6 text-white/70 hover:text-red-400 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex items-center gap-2 px-4 z-10"
          >
            <Flag className="w-4 h-4" />
            <span className="text-sm font-medium">Report</span>
          </button>

          {/* Image */}
          <div className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4 md:mx-24 flex items-center justify-center p-4">
            <Image
              src={activePhoto.image_url}
              alt={activePhoto.caption || "Campus photo"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            {/* Caption in lightbox */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center text-center">
              {activePhoto.caption && (
                <p className="text-white text-lg font-medium mb-2 max-w-2xl">{activePhoto.caption}</p>
              )}
              {activePhoto.profiles?.full_name && (
                <p className="text-gray-400 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Shot by {activePhoto.profiles.full_name}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={!!reportPhotoId} onOpenChange={(open) => !open && setReportPhotoId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Report Photo
            </DialogTitle>
            <DialogDescription>
              Help us keep the gallery safe. Our editorial team reviews all reports.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleReport} className="space-y-6 pt-4">
            <div className="space-y-4">
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-red-100 bg-red-50/50">
                  <RadioGroupItem value="no_consent" id="no_consent" className="mt-1" />
                  <Label htmlFor="no_consent" className="font-semibold text-gray-900 cursor-pointer">
                    I am in this photo and do not consent
                    <p className="font-normal text-gray-500 text-xs mt-1">This is a priority report and will be handled urgently.</p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="cursor-pointer text-gray-700">Inappropriate content</Label>
                </div>
                <div className="flex items-center space-x-3 p-2">
                  <RadioGroupItem value="copyright" id="copyright" />
                  <Label htmlFor="copyright" className="cursor-pointer text-gray-700">Copyright violation</Label>
                </div>
                <div className="flex items-center space-x-3 p-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="cursor-pointer text-gray-700">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Additional Details (Optional)</Label>
              <Textarea 
                placeholder="Provide any helpful context..." 
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setReportPhotoId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingReport} variant="destructive">
                Submit Report
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
