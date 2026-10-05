"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, Loader2, Eye } from "lucide-react";
import { updateJobStatus, deleteJob } from "./actions";
import Link from "next/link";

export function JobActionButtons({ id, status, slug }: { id: string; status: string; slug: string }) {
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
      <Button 
        variant="ghost" 
        size="icon" 
        title="Preview" 
        asChild
        className="text-gray-400 hover:text-blue-600"
      >
        <Link href={`/jobs/${slug}`}>
          <Eye className="w-4 h-4" />
        </Link>
      </Button>
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
