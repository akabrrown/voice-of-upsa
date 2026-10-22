"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, Check, Loader2, PlayCircle, ExternalLink, AlertTriangle, AlertCircle } from "lucide-react";
import { updateAdStatus } from "./actions";
import { toast } from "sonner";

interface Advertisement {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone?: string | null;
  ad_tier?: string | null;
  package_tier?: string | null;
  ad_placement?: string;
  ad_type?: string;
  banner_image_url?: string | null;
  creative_url?: string | null;
  target_url?: string | null;
  status: "pending" | "approved" | "rejected" | "active" | "completed" | "expired";
  start_date?: string | null;
  starts_at?: string | null;
  end_date?: string | null;
  ends_at?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

export default function AdsManagerClient({ initialAds }: { initialAds: Advertisement[] }) {
  const [ads, setAds] = useState<Advertisement[]>(initialAds);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "approved" | "completed" | "rejected">("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Structured Rejection Modal State
  const [rejectingAd, setRejectingAd] = useState<{ id: string; companyName: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const REJECTION_PRESETS = [
    "Creative banner image does not meet resolution or sizing requirements.",
    "Target URL or destination landing page is non-functional.",
    "Payment verification receipt missing or incomplete.",
    "Violates campus advertising and institutional policies.",
    "Promotional content deemed inappropriate for student body.",
  ];

  const filteredAds = ads.filter(ad => filter === "all" || ad.status === filter);

  const handleStatusChange = async (adId: string, newStatus: any, notes?: string) => {
    setLoadingId(adId);
    try {
      const result = await updateAdStatus(adId, newStatus, notes);
      if (result.error) throw new Error(result.error);
      
      setAds(ads.map(ad => ad.id === adId ? { ...ad, status: newStatus, admin_notes: notes || ad.admin_notes } : ad));
      toast.success(`Ad status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectingAd) return;
    if (!rejectionReason.trim()) {
      toast.error("Please select or write a rejection reason.");
      return;
    }

    setIsSubmittingRejection(true);
    try {
      const result = await updateAdStatus(rejectingAd.id, "rejected", rejectionReason.trim());
      if (result.error) throw new Error(result.error);

      setAds(ads.map(ad => ad.id === rejectingAd.id ? { ...ad, status: "rejected", admin_notes: rejectionReason.trim() } : ad));
      toast.success(`Ad rejected with feedback recorded.`);
      setRejectingAd(null);
      setRejectionReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject advertisement.");
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100">Pending</Badge>;
      case "approved": return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100">Approved</Badge>;
      case "active": return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100">Active</Badge>;
      case "completed": return <Badge className="bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-slate-300 hover:bg-gray-100">Completed</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100">Rejected</Badge>;
      default: return <Badge className="dark:bg-white/10 dark:text-slate-200">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["pending", "active", "approved", "completed", "rejected", "all"].map((tab) => (
          <Button
            key={tab}
            variant={filter === tab ? "default" : "outline"}
            onClick={() => setFilter(tab as any)}
            className={`capitalize ${filter === tab ? "bg-upsa-navy text-white hover:bg-upsa-navy/90 dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-amber-400 font-bold" : "text-gray-600 dark:text-slate-300 dark:border-white/10 dark:hover:bg-white/5"}`}
          >
            {tab}
            <span className="ml-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
              {tab === "all" ? ads.length : ads.filter(a => a.status === tab).length}
            </span>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAds.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0C1729] rounded-xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-500 dark:text-slate-400 font-medium">No advertisements found for this filter.</p>
          </div>
        ) : (
          filteredAds.map((ad) => (
            <Card key={ad.id} className="overflow-hidden bg-white dark:bg-[#0C1729] border border-gray-100 dark:border-white/10">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row border-b border-gray-100 dark:border-white/10">
                  {/* Image Section */}
                  <div className="w-full md:w-64 h-40 md:h-auto bg-gray-50 dark:bg-white/[0.02] relative border-r border-gray-100 dark:border-white/10 flex items-center justify-center p-4">
                    {ad.banner_image_url || (ad as any).creative_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={ad.banner_image_url || (ad as any).creative_url} 
                        alt={ad.company_name} 
                        className="max-h-full max-w-full object-contain rounded-md"
                      />
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-slate-500">No Image</span>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-upsa-navy dark:text-white">{ad.company_name}</h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                            {ad.contact_email} {ad.contact_phone && `• ${ad.contact_phone}`}
                          </p>
                        </div>
                        <StatusBadge status={ad.status} />
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-slate-300 mb-4">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-slate-200 block text-xs uppercase tracking-wider mb-1">Tier</span>
                          <span className="capitalize">{ad.ad_tier || (ad as any).package_tier || "Standard"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-slate-200 block text-xs uppercase tracking-wider mb-1">Placement</span>
                          <span className="capitalize">{ad.ad_placement || ad.ad_type || "Sidebar"}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-slate-200 block text-xs uppercase tracking-wider mb-1">Submitted</span>
                          <span>{format(new Date(ad.created_at), "MMM d, yyyy")}</span>
                        </div>
                        {ad.target_url && (
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-slate-200 block text-xs uppercase tracking-wider mb-1">Target URL</span>
                            <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                              Link <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>

                      {ad.admin_notes && (
                        <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-bold text-gray-700 dark:text-slate-200">Moderator Note: </span>
                            <span className="text-gray-600 dark:text-slate-400">{ad.admin_notes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-50 dark:border-white/10">
                      {ad.status === "pending" && (
                        <>
                          <Button 
                            onClick={() => handleStatusChange(ad.id, "approved")}
                            disabled={loadingId === ad.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            {loadingId === ad.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Approve
                          </Button>
                          <Button 
                            onClick={() => {
                              setRejectingAd({ id: ad.id, companyName: ad.company_name });
                              setRejectionReason("");
                            }}
                            disabled={loadingId === ad.id}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}

                      {ad.status === "approved" && (
                        <Button 
                          onClick={() => handleStatusChange(ad.id, "active")}
                          disabled={loadingId === ad.id}
                          className="bg-upsa-gold text-upsa-navy dark:text-upsa-navy hover:bg-yellow-400 font-bold"
                        >
                          {loadingId === ad.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
                          Set as Active
                        </Button>
                      )}

                      {ad.status === "active" && (
                        <Button 
                          onClick={() => handleStatusChange(ad.id, "completed")}
                          disabled={loadingId === ad.id}
                          variant="outline"
                          className="dark:bg-transparent dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                          {loadingId === ad.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Structured Ad Rejection Modal */}
      {rejectingAd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1729] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reject Advertisement</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Provide rejection reason for {rejectingAd.companyName}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              Select a standard preset or type customized feedback explaining why this advertising request cannot be accepted.
            </p>

            <div className="space-y-3 mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Quick Presets</label>
              <div className="flex flex-col gap-2">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
                      rejectionReason === preset
                        ? "border-red-500 bg-red-50/50 dark:bg-red-950/30 text-red-800 dark:text-red-300 font-semibold"
                        : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-[#060D1A] text-gray-700 dark:text-slate-300"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">Custom Moderator Feedback</label>
              <Textarea
                placeholder="Detailed reason for ad rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="text-sm bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
              <Button
                variant="outline"
                onClick={() => setRejectingAd(null)}
                disabled={isSubmittingRejection}
                className="dark:bg-transparent dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRejection}
                disabled={isSubmittingRejection || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isSubmittingRejection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
