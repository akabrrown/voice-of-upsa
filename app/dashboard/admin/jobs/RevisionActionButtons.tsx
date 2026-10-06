"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, X, Eye, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approveRevision, rejectRevision } from "./actions";

export function RevisionActionButtons({ revision, originalPost }: { revision: any, originalPost: any }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    if (!confirm("Are you sure you want to approve this revision? The changes will be applied to the live posting immediately.")) return;
    
    startTransition(async () => {
      const result = await approveRevision(revision.id, revision.posting_id, revision.proposed_changes);
      if (result.ok) {
        toast.success("Revision approved and applied.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleReject = () => {
    if (!confirm("Are you sure you want to reject this revision? The user will be notified.")) return;
    
    startTransition(async () => {
      const result = await rejectRevision(revision.id);
      if (result.ok) {
        toast.success("Revision rejected.");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleViewDiff = () => {
    // In a real app, this would open a modal showing the side-by-side diff.
    // For now, we'll just log or show a simple alert of the keys changed.
    const keys = Object.keys(revision.proposed_changes);
    let diffText = "Fields changed:\n\n";
    keys.forEach(k => {
      diffText += `${k}:\nOriginal: ${originalPost?.[k] ?? 'N/A'}\nProposed: ${revision.proposed_changes[k]}\n\n`;
    });
    alert(diffText);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
        onClick={handleViewDiff}
        title="View Changes"
      >
        <Eye className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" 
        disabled={isPending}
        onClick={handleApprove}
        title="Approve Revision"
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" 
        disabled={isPending}
        onClick={handleReject}
        title="Reject Revision"
      >
        <X className="w-4 h-4" />
      </Button>
    </>
  );
}
