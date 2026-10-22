"use client";

import { useState, useEffect } from "react";
import { format, addDays, addMonths } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  configureAndSaveAd,
  type AdConfigurationInput,
  type AdStatus,
} from "./actions";
import { AdDetailModal, type AdRecord } from "@/components/layout/AdDetailModal";
import {
  Building2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  Eye,
  Settings2,
  Layers,
  Link as LinkIcon,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export interface AdminAdItem extends AdRecord {
  id: string;
  status: AdStatus;
  created_at: string;
}

interface AdPreviewConfigModalProps {
  ad: AdminAdItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAdUpdated: (updatedAd: AdminAdItem) => void;
}

export function AdPreviewConfigModal({
  ad,
  isOpen,
  onClose,
  onAdUpdated,
}: AdPreviewConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"configure" | "preview">("preview");
  const [previewPlacement, setPreviewPlacement] = useState<"leaderboard" | "sidebar" | "in-feed">("sidebar");
  const [isVisitorModalPreviewOpen, setIsVisitorModalPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form Configuration State
  const [placement, setPlacement] = useState<"leaderboard" | "sidebar" | "in-feed">("sidebar");
  const [tier, setTier] = useState<string>("standard");
  const [status, setStatus] = useState<AdStatus>("pending");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [productDescription, setProductDescription] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");

  useEffect(() => {
    if (ad) {
      const initialPlacement = (ad.ad_placement || ad.ad_type || "sidebar") as "leaderboard" | "sidebar" | "in-feed";
      setPlacement(initialPlacement);
      setPreviewPlacement(initialPlacement);
      setTier(ad.ad_tier || ad.package_tier || "standard");
      setStatus(ad.status || "pending");
      setTargetUrl(ad.target_url || "");
      setProductName(ad.product_name || "");
      setProductDescription(ad.product_description || "");
      setAdminNotes(ad.admin_notes || "");

      // Date formatting for input fields
      const start = ad.start_date || ad.starts_at;
      if (start) {
        try {
          setStartDate(format(new Date(start), "yyyy-MM-dd"));
        } catch {
          setStartDate("");
        }
      } else {
        setStartDate(format(new Date(), "yyyy-MM-dd"));
      }

      const end = ad.end_date || ad.ends_at;
      if (end) {
        try {
          setEndDate(format(new Date(end), "yyyy-MM-dd"));
        } catch {
          setEndDate("");
        }
      } else {
        // Default to 14 days campaign
        setEndDate(format(addDays(new Date(), 14), "yyyy-MM-dd"));
      }
    }
  }, [ad]);

  if (!ad) return null;

  const imageSrc = ad.banner_image_url || ad.creative_url;

  const handleApplyPresetDuration = (days: number) => {
    const base = startDate ? new Date(startDate) : new Date();
    setEndDate(format(addDays(base, days), "yyyy-MM-dd"));
  };

  const handleApplyPresetMonths = (months: number) => {
    const base = startDate ? new Date(startDate) : new Date();
    setEndDate(format(addMonths(base, months), "yyyy-MM-dd"));
  };

  const handleSave = async (overrideStatus?: AdStatus) => {
    setIsSaving(true);
    try {
      const targetStatus = overrideStatus || status;

      const payload: AdConfigurationInput = {
        ad_placement: placement,
        ad_type: placement,
        ad_tier: tier,
        package_tier: tier,
        status: targetStatus,
        target_url: targetUrl.trim(),
        product_name: productName.trim(),
        product_description: productDescription.trim(),
        start_date: startDate ? new Date(startDate).toISOString() : null,
        starts_at: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        ends_at: endDate ? new Date(endDate).toISOString() : null,
        admin_notes: adminNotes.trim(),
      };

      const result = await configureAndSaveAd(ad.id, payload);
      if (result.error) throw new Error(result.error);

      const updatedAdItem: AdminAdItem = {
        ...ad,
        ...payload,
        status: targetStatus,
        ad_placement: placement,
        ad_type: placement,
        ad_tier: tier,
        package_tier: tier,
      };

      onAdUpdated(updatedAdItem);
      toast.success(
        overrideStatus === "active"
          ? "Ad configured & set to ACTIVE!"
          : "Ad configuration saved successfully."
      );
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save ad configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const adPreviewRecord: AdRecord = {
    ...ad,
    product_name: productName || ad.product_name,
    product_description: productDescription || ad.product_description,
    target_url: targetUrl || ad.target_url,
    ad_placement: previewPlacement,
    ad_type: previewPlacement,
    ad_tier: tier,
    package_tier: tier,
    start_date: startDate,
    end_date: endDate,
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl md:max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1729] shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-upsa-navy via-[#00264d] to-upsa-navy p-5 sm:p-6 text-white border-b border-white/10 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-upsa-gold text-upsa-navy shadow-sm">
                  <ShieldCheck className="h-3 w-3" />
                  Admin Moderation
                </span>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  ID: {ad.id.slice(0, 8)}...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Current Status:</span>
                <Badge className={`uppercase text-[10px] font-bold ${
                  ad.status === "active" ? "bg-emerald-500 text-white" :
                  ad.status === "approved" ? "bg-blue-500 text-white" :
                  ad.status === "rejected" ? "bg-red-500 text-white" :
                  "bg-amber-500 text-white"
                }`}>
                  {ad.status}
                </Badge>
              </div>
            </div>

            <DialogHeader className="gap-1 text-left relative z-10">
              <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {ad.company_name}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 flex items-center gap-2">
                <span>Contact: {ad.contact_email}</span>
                {ad.contact_phone && <span>• {ad.contact_phone}</span>}
              </DialogDescription>
            </DialogHeader>

            {/* Sub-navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 relative z-10">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "preview"
                    ? "bg-upsa-gold text-upsa-navy shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Previews</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("configure")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "configure"
                    ? "bg-upsa-gold text-upsa-navy shadow-sm"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Configure Settings</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* TAB 1: LIVE PREVIEWS */}
            {activeTab === "preview" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-upsa-navy dark:text-upsa-gold" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      Preview Frame:
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(["leaderboard", "sidebar", "in-feed"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreviewPlacement(mode)}
                        className={`capitalize px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          previewPlacement === mode
                            ? "bg-upsa-navy text-white dark:bg-upsa-gold dark:text-upsa-navy shadow-sm"
                            : "bg-gray-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-gray-300"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsVisitorModalPreviewOpen(true)}
                      className="px-3 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1 transition-all"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Test Visitor Detail Popup</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Placement View */}
                <div className="p-4 sm:p-6 rounded-2xl bg-slate-100 dark:bg-black/40 border border-dashed border-gray-300 dark:border-white/15 flex flex-col items-center justify-center min-h-[220px]">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                    Simulated {previewPlacement.toUpperCase()} Container
                  </span>

                  {/* Leaderboard Frame (728x90) */}
                  {previewPlacement === "leaderboard" && (
                    <div className="w-full max-w-[728px] aspect-[728/90] min-h-[70px] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 relative group bg-black/80">
                      <div className="absolute top-2 right-2 bg-black/80 text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow">
                        <span>Ad · Details</span>
                        <Info className="h-2.5 w-2.5 text-upsa-gold" />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc || ""}
                        alt={productName || ad.company_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Sidebar Frame (300x250) */}
                  {previewPlacement === "sidebar" && (
                    <div className="w-[300px] h-[250px] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 relative group bg-black/80">
                      <div className="absolute top-2 right-2 bg-black/80 text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow">
                        <span>Ad · Details</span>
                        <Info className="h-2.5 w-2.5 text-upsa-gold" />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc || ""}
                        alt={productName || ad.company_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* In-Feed Frame */}
                  {previewPlacement === "in-feed" && (
                    <div className="w-full max-w-xl min-h-[120px] rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-white/10 relative group bg-black/80">
                      <div className="absolute top-2 right-2 bg-black/80 text-[9px] uppercase font-bold text-white px-2 py-0.5 rounded-full z-10 flex items-center gap-1 shadow">
                        <span>Ad · Details</span>
                        <Info className="h-2.5 w-2.5 text-upsa-gold" />
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc || ""}
                        alt={productName || ad.company_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>

                {/* External Destination Verification Bar */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Destination Link
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <LinkIcon className="h-3.5 w-3.5 text-blue-500" />
                      <span className="truncate max-w-sm sm:max-w-md">
                        {targetUrl || "No destination URL specified"}
                      </span>
                    </div>
                  </div>

                  {targetUrl && (
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-upsa-navy hover:bg-[#002244] dark:bg-upsa-gold dark:text-upsa-navy inline-flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>Verify & Test Link</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CONFIGURATION FORM */}
            {activeTab === "configure" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Placement Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Placement Zone
                    </label>
                    <select
                      value={placement}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setPlacement(val);
                        setPreviewPlacement(val);
                      }}
                      className="w-full h-9 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-[#060D1A] px-3 py-1 text-xs text-slate-900 dark:text-white font-medium focus:border-upsa-gold outline-none"
                    >
                      <option value="leaderboard">Leaderboard (728x90)</option>
                      <option value="sidebar">Sidebar (300x250)</option>
                      <option value="in-feed">In-Feed Native</option>
                    </select>
                  </div>

                  {/* Tier Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Pricing Tier
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-[#060D1A] px-3 py-1 text-xs text-slate-900 dark:text-white font-medium focus:border-upsa-gold outline-none"
                    >
                      <option value="basic">Basic (GH₵ 250 / wk)</option>
                      <option value="standard">Standard (GH₵ 500 / 2 wks)</option>
                      <option value="premium">Premium Partner (GH₵ 950 / mo)</option>
                    </select>
                  </div>

                  {/* Status Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Campaign Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as AdStatus)}
                      className="w-full h-9 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-[#060D1A] px-3 py-1 text-xs text-slate-900 dark:text-white font-medium focus:border-upsa-gold outline-none"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved (Awaiting Launch)</option>
                      <option value="active">Active (Live On Site)</option>
                      <option value="completed">Completed / Expired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Schedule Dates */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-upsa-gold" />
                      Campaign Scheduling Dates
                    </span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDuration(7)}
                        className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        +1 Wk
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetDuration(14)}
                        className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        +2 Wks
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPresetMonths(1)}
                        className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        +1 Mo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs bg-white dark:bg-[#060D1A]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs bg-white dark:bg-[#060D1A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Target URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Target Destination URL
                  </label>
                  <Input
                    type="url"
                    placeholder="https://example.com/promotion"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="text-xs bg-white dark:bg-[#060D1A]"
                  />
                </div>

                {/* Product / Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Product / Campaign Title
                  </label>
                  <Input
                    placeholder="e.g. 50% Off Student Laptop Deals"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="text-xs bg-white dark:bg-[#060D1A]"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Campaign Description (Visible to Campus Visitors in Detail Popup)
                  </label>
                  <Textarea
                    placeholder="Describe the offer, discount, or services offered to UPSA students and staff..."
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={3}
                    className="text-xs bg-white dark:bg-[#060D1A]"
                  />
                </div>

                {/* Moderator Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Admin / Moderator Internal Notes
                  </label>
                  <Input
                    placeholder="e.g. Payment verified via MoMo receipt #103948, reviewed by Editor"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="text-xs bg-white dark:bg-[#060D1A]"
                  />
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
                className="w-full sm:w-auto text-xs font-bold"
              >
                Cancel
              </Button>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  variant="outline"
                  className="w-full sm:w-auto text-xs font-bold text-slate-800 dark:text-white"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-blue-500" />}
                  Save Configuration
                </Button>

                <Button
                  type="button"
                  onClick={() => handleSave("active")}
                  disabled={isSaving}
                  className="w-full sm:w-auto text-xs font-bold text-upsa-navy bg-upsa-gold hover:bg-[#dfb945] shadow-md transition-all active:scale-[0.99]"
                >
                  {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5 mr-1.5" />}
                  Save & Make Active Now
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Visitor Modal Preview Simulator */}
      <AdDetailModal
        ad={adPreviewRecord}
        isOpen={isVisitorModalPreviewOpen}
        onClose={() => setIsVisitorModalPreviewOpen(false)}
      />
    </>
  );
}
