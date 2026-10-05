"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { updateJobStatus, deleteJob } from "./actions";

export function JobActionButtons({ id, status }: { id: string; status: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleUpdateStatus = async (newStatus: "approved" | "rejected") => {
    setIsPending(true);
    await updateJobStatus(id, newStatus);
    setIsPending(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    setIsPending(true);
    await deleteJob(id);
    setIsPending(false);
  };

  return (
    <>
      {status === 'pending_review' && (
        <>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Approve" 
            onClick={() => handleUpdateStatus("approved")}
            disabled={isPending}
            className="text-gray-400 hover:text-green-600"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            title="Reject" 
            onClick={() => handleUpdateStatus("rejected")}
            disabled={isPending}
            className="text-gray-400 hover:text-red-600"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          </Button>
        </>
      )}
      <Button 
        variant="ghost" 
        size="icon" 
        title="Delete" 
        onClick={handleDelete}
        disabled={isPending}
        className="text-gray-400 hover:text-red-600"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
    </>
  );
}
