"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, Loader2, Eye, Pencil, ShieldAlert } from "lucide-react";
import { updateJobStatus, deleteJob } from "./actions";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const REJECTION_PRESETS = [
  "Missing compensation or stipend transparency",
  "Unverified organization or suspicious recruiter",
  "Inappropriate or discriminatory requirements",
  "Duplicate or expired job listing",
  "Violates UPSA student employment guidelines",
];

export function JobActionButtons({ id, status, slug, title }: { id: string; status: string; slug: string; title?: string }) {
  const [isPending, setIsPending] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    setIsPending(true);
    try {
      const res = await updateJobStatus(id, "approved");
      if (res.ok) {
        toast.success("Job posting approved and published!");
      } else {
        toast.error(res.error || "Failed to approve job posting");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejecting this posting.");
      return;
    }

    setIsPending(true);
    try {
      const res = await updateJobStatus(id, "rejected", rejectionReason.trim());
      if (res.ok) {
        toast.success("Job posting rejected and poster notified.");
        setRejectOpen(false);
        setRejectionReason("");
      } else {
        toast.error(res.error || "Failed to reject job posting");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsPending(true);
    try {
      const res = await deleteJob(id);
      if (res.ok) {
        toast.success("Job posting deleted.");
        setDeleteOpen(false);
      } else {
        toast.error(res.error || "Failed to delete job");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        title="Preview" 
        asChild
        className="text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-white/10"
      >
        <Link href={`/dashboard/admin/jobs/${slug}`}>
          <Eye className="w-4 h-4" />
        </Link>
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        title="Edit" 
        asChild
        className="text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/10"
      >
        <Link href={`/dashboard/admin/jobs/${slug}/edit`}>
          <Pencil className="w-4 h-4" />
        </Link>
      </Button>

      {status === 'pending_review' && (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Approve" 
            onClick={handleApprove}
            disabled={isPending}
            className="text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Reject" 
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
            className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </>
      )}

      <Button 
        variant="ghost" 
        size="icon" 
        title="Delete" 
        onClick={() => setDeleteOpen(true)}
        disabled={isPending}
        className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-white/10"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
              <ShieldAlert className="w-5 h-5" />
              <span>Reject Job Submission</span>
            </div>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
              Provide Rejection Reason
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-slate-400">
              The poster will be notified with this feedback so they can correct their listing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Quick Presets</Label>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[11px] bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-slate-200 px-2.5 py-1 rounded-md transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason-input" className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                Reason Details <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason-input"
                placeholder="Explain why this opportunity cannot be approved..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="resize-none text-xs bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isPending || !rejectionReason.trim()}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Delete Job Posting
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-slate-400">
              Are you sure you want to remove this job posting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Job"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
