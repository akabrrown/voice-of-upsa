"use client";

import { useState } from "react";
import { ReportModal } from "@/components/common/ReportModal";
import { Flag } from "lucide-react";

interface JobReportButtonProps {
  jobId: string;
  jobTitle: string;
}

export function JobReportButton({ jobId, jobTitle }: JobReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={hasReported}
        className={`text-sm transition-colors w-full text-center flex items-center justify-center gap-1.5 underline underline-offset-4 ${
          hasReported
            ? "text-gray-400 cursor-not-allowed no-underline"
            : "text-gray-400 hover:text-red-500"
        }`}
      >
        <Flag className="w-3.5 h-3.5" />
        {hasReported ? "Posting Reported" : "Report this posting"}
      </button>

      <ReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        resourceType="job"
        resourceId={jobId}
        resourceTitle={jobTitle}
        onSuccess={() => setHasReported(true)}
      />
    </>
  );
}
