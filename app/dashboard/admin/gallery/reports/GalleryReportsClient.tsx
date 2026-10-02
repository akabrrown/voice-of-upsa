"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveReport } from "@/app/actions/gallery";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, Check, ExternalLink, ImageOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";

type Report = {
  id: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  details: string | null;
  reporter_id: string;
  status: "pending" | "investigating" | "resolved";
  created_at: string;
  reporter: {
    first_name: string;
    last_name: string;
    index_number: string | null;
  } | null;
  photo: {
    id: string;
    image_url: string;
    album_id: string;
    album: {
      title: string;
    } | null;
  } | null;
};

export default function GalleryReportsClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleResolve = async (reportId: string, action: "dismiss" | "delete_photo", photoId?: string) => {
    if (action === "delete_photo" && !confirm("Are you sure you want to delete this photo permanently? This action cannot be undone.")) {
      return;
    }

    setIsProcessing(reportId);
    try {
      const res = await resolveReport(reportId, action, photoId);
      if (res.success) {
        toast.success(res.message || "Report resolved");
        setReports(reports.filter(r => r.id !== reportId));
      } else {
        toast.error(res.error || "Failed to resolve report");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingReports = reports.filter(r => r.status !== "resolved");

  if (pendingReports.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center py-24">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900">No active reports</h3>
        <p className="text-gray-500 max-w-sm mx-auto mt-2">
          There are currently no flagged photos requiring moderation.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {pendingReports.map((report) => (
        <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {report.photo ? (
            <div className="relative aspect-[4/3] bg-gray-100">
              <Image
                src={report.photo.image_url}
                alt="Reported photo"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute top-3 left-3 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1.5" />
                Reported
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] bg-gray-50 flex flex-col items-center justify-center text-gray-400 border-b border-gray-100">
              <ImageOff className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-sm font-medium">Photo has been deleted</span>
            </div>
          )}

          <div className="p-5 flex flex-col flex-grow">
            <div className="mb-4 space-y-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Reason</span>
                <p className="font-bold text-gray-900 text-lg capitalize">{report.reason.replace(/_/g, ' ')}</p>
              </div>
              {report.details && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Details</span>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-1">
                    {report.details}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-auto space-y-4">
              <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                <div className="text-sm">
                  <span className="text-gray-500 block text-xs font-semibold uppercase">Reported By</span>
                  <span className="font-medium text-gray-900">
                    {report.reporter ? `${report.reporter.first_name} ${report.reporter.last_name}` : "Anonymous"}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(report.created_at), 'MMM d, yyyy')}
                </span>
              </div>

              {report.photo && (
                <div className="flex justify-between items-center text-sm bg-blue-50/50 p-2 rounded border border-blue-100">
                  <span className="text-gray-600">Album: <span className="font-medium">{report.photo.album?.title || "Unknown"}</span></span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => handleResolve(report.id, "dismiss")} 
                  disabled={isProcessing === report.id}
                  variant="outline" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Dismiss Report
                </Button>
                {report.photo && (
                  <Button 
                    onClick={() => handleResolve(report.id, "delete_photo", report.photo!.id)} 
                    disabled={isProcessing === report.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
