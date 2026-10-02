"use client";

import { useState } from "react";
import Image from "next/image";
import { moderatePhoto } from "@/app/actions/gallery";
import { Button } from "@/components/ui/button";
import { Check, X, ImageIcon, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

type PendingPhoto = {
  id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  submitted_by: string | null;
  status: "pending_review" | "approved" | "rejected";
  created_at: string;
  album: {
    title: string;
  } | null;
  submitter: {
    first_name: string;
    last_name: string;
    index_number: string | null;
  } | null;
};

export default function GalleryModerationClient({ initialPhotos }: { initialPhotos: PendingPhoto[] }) {
  const [photos, setPhotos] = useState<PendingPhoto[]>(initialPhotos);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleModerate = async (photoId: string, status: "approved" | "rejected") => {
    setIsProcessing(photoId);
    try {
      const res = await moderatePhoto(photoId, status);
      if (res.success) {
        toast.success(`Photo ${status} successfully.`);
        setPhotos(photos.filter(p => p.id !== photoId));
      } else {
        toast.error(res.error || `Failed to ${status} photo`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(null);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center py-24">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Queue is empty</h3>
        <p className="text-gray-500 max-w-sm mx-auto mt-2">
          All student photo submissions have been reviewed. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {photos.map((photo) => (
        <div key={photo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="relative aspect-[4/3] bg-gray-100">
            <Image
              src={photo.image_url}
              alt={photo.caption || "Submitted photo"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                {photo.caption || <span className="text-gray-400 italic">No caption provided</span>}
              </p>
            </div>
            
            <div className="mt-auto space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100">
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500">Album:</span>
                  <span className="font-medium text-gray-900 truncate ml-2" title={photo.album?.title}>
                    {photo.album?.title || "Unknown Album"}
                  </span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-500">Submitter:</span>
                  <span className="font-medium text-gray-900">
                    {photo.submitter ? `${photo.submitter.first_name} ${photo.submitter.last_name}` : "Anonymous"}
                  </span>
                </div>
                {photo.submitter?.index_number && (
                  <div className="flex justify-between mb-1.5">
                    <span className="text-gray-500">Index:</span>
                    <span className="font-medium text-gray-900 font-mono">
                      {photo.submitter.index_number}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-700">
                    {format(new Date(photo.created_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => handleModerate(photo.id, "rejected")} 
                  disabled={isProcessing === photo.id}
                  variant="outline" 
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  onClick={() => handleModerate(photo.id, "approved")} 
                  disabled={isProcessing === photo.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
