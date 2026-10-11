"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitContentReport, type ReportReason } from "@/app/actions/reports";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: "article" | "confession" | "gallery_photo" | "job" | "mart_product" | "service";
  resourceId: string;
  resourceTitle?: string;
  onSuccess?: () => void;
}

const REPORT_REASONS: { label: string; value: ReportReason }[] = [
  { label: "Harassment or Bullying", value: "harassment" },
  { label: "Inappropriate or Offensive Content", value: "inappropriate" },
  { label: "Identifies Specific People (Doxxing)", value: "identifies_person" },
  { label: "Self-Harm or Suicide Concern", value: "self_harm" },
  { label: "Threat of Violence or Harm", value: "threat_of_violence" },
  { label: "Spam or Commercial Solicitation", value: "spam" },
  { label: "Scam or Fraudulent Offer", value: "scam" },
  { label: "Misleading Information", value: "misleading" },
  { label: "Other Policy Violation", value: "other" },
];

export function ReportModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  onSuccess,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId) return;

    setIsSubmitting(true);
    try {
      const res = await submitContentReport({
        resourceType,
        resourceId,
        reason,
        details,
      });

      if (res.success) {
        toast.success(res.message || "Report submitted successfully.");
        setDetails("");
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Failed to submit report.");
      }
    } catch {
      toast.error("An unexpected error occurred while reporting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <ShieldAlert className="w-5 h-5" />
              <span>Report Community Content</span>
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900">
              {resourceTitle ? `Report "${resourceTitle}"` : "Flag for Moderation"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Reports are treated confidentially and reviewed by campus moderators. False or malicious reports violate platform guidelines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-reason" className="text-xs font-bold text-gray-700">
                Primary Reason <span className="text-red-500">*</span>
              </Label>
              <Select value={reason} onValueChange={(val) => setReason(val as ReportReason)}>
                <SelectTrigger id="report-reason" className="w-full text-xs">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-details" className="text-xs font-bold text-gray-700">
                Additional Details (Optional)
              </Label>
              <Textarea
                id="report-details"
                placeholder="Describe why this content violates community guidelines..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={400}
                className="resize-none h-24 text-xs"
              />
              <span className="text-[10px] text-gray-400 block text-right">
                {details.length}/400
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
