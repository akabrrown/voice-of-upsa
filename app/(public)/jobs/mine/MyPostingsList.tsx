"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { closePosting } from "../actions";

export type MyPosting = {
  id: string;
  slug: string;
  title: string;
  organization_name: string;
  type: string;
  status: "pending_review" | "approved" | "rejected" | "closed";
  expires_at: string | null;
  created_at: string;
};

const STATUS_STYLES: Record<MyPosting["status"], { label: string; className: string }> = {
  pending_review: { label: "Pending review", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Live", className: "bg-green-100 text-green-800" },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
  closed: { label: "Closed", className: "bg-gray-200 text-gray-700" },
};

export default function MyPostingsList({ postings }: { postings: MyPosting[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function handleClose(id: string) {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const result = await closePosting(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
      setBusyId(null);
    });
  }

  if (postings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <Briefcase className="mx-auto h-10 w-10 text-gray-300 mb-4" />
        <h2 className="text-lg font-bold text-[#1B2A4A]">No postings yet</h2>
        <p className="text-gray-500 mt-1">Opportunities you submit will show up here with their review status.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {postings.map((posting) => {
        const status = STATUS_STYLES[posting.status];
        const canClose = posting.status === "approved" || posting.status === "pending_review";
        return (
          <div key={posting.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status.className}`}>{status.label}</span>
                <span className="text-xs uppercase tracking-wide text-gray-400">{posting.type.replace("_", " ")}</span>
              </div>
              <h3 className="font-bold text-[#1B2A4A] truncate">{posting.title}</h3>
              <p className="text-sm text-gray-500">
                {posting.organization_name} · Posted {new Date(posting.created_at).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {posting.status === "approved" && (
                <Link href={`/jobs/${posting.slug}`} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View
                </Link>
              )}
              <Link href={`/jobs/mine/${posting.id}/edit`} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50">
                Edit
              </Link>
              {canClose && (
                <button
                  type="button"
                  disabled={isPending && busyId === posting.id}
                  onClick={() => handleClose(posting.id)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {busyId === posting.id ? "Closing…" : "Close"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
