"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deletePoll, updatePollStatus } from "@/app/actions/polls";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart2,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface PollAdminActionsProps {
  poll: {
    id: string;
    slug: string;
    question: string;
    status: string;
    total_votes: number;
  };
}

export function PollAdminActions({ poll }: PollAdminActionsProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/polls/${poll.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Poll link copied to clipboard!");
  };

  const handleStatusChange = async (newStatus: "published" | "closed" | "draft") => {
    setIsUpdatingStatus(true);
    try {
      const res = await updatePollStatus(poll.id, newStatus);
      if (res.success) {
        toast.success(res.message || `Poll status updated to ${newStatus}`);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deletePoll(poll.id);
      if (res.success) {
        toast.success("Poll deleted successfully");
        setDeleteDialogOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete poll");
      }
    } catch {
      toast.error("Failed to delete poll");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        asChild
        title="View Live Results"
        className="text-gray-400 hover:text-upsa-navy"
      >
        <Link href={`/polls/${poll.slug}`} target="_blank">
          <BarChart2 className="w-4 h-4" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        asChild
        title="Edit Poll"
        className="text-gray-400 hover:text-amber-600"
      >
        <Link href={`/dashboard/admin/polls/${poll.id}/edit`}>
          <Edit className="w-4 h-4" />
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-700"
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin text-upsa-navy" />
            ) : (
              <MoreVertical className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-white">
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            <Copy className="w-4 h-4 mr-2 text-gray-500" />
            Copy Public Link
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/polls/${poll.slug}`} target="_blank">
              <ExternalLink className="w-4 h-4 mr-2 text-gray-500" />
              Open Live Page
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {poll.status === "draft" && (
            <DropdownMenuItem
              onClick={() => handleStatusChange("published")}
              className="cursor-pointer text-green-700 focus:text-green-800 focus:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Publish Now
            </DropdownMenuItem>
          )}

          {poll.status === "published" && (
            <DropdownMenuItem
              onClick={() => handleStatusChange("closed")}
              className="cursor-pointer text-amber-700 focus:text-amber-800 focus:bg-amber-50"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Close Poll
            </DropdownMenuItem>
          )}

          {poll.status === "closed" && (
            <DropdownMenuItem
              onClick={() => handleStatusChange("published")}
              className="cursor-pointer text-green-700 focus:text-green-800 focus:bg-green-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Re-open Poll
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Poll
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Campus Poll
            </DialogTitle>
            <DialogDescription className="text-gray-600 pt-2">
              Are you sure you want to delete this poll?
              <br />
              <strong className="text-gray-900 block mt-2 text-sm line-clamp-2">
                &ldquo;{poll.question}&rdquo;
              </strong>
              {poll.total_votes > 0 && (
                <span className="block mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  This poll has recorded {poll.total_votes} {poll.total_votes === 1 ? "vote" : "votes"}.
                  Soft-deleting will remove it from the public listing while preserving audit records.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
