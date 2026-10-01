"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, Check, Loader2, PlayCircle, ExternalLink } from "lucide-react";
import { updateAdStatus } from "./actions";
import { toast } from "react-hot-toast";

interface Advertisement {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string | null;
  ad_tier: string;
  banner_image_url: string | null;
  target_url: string | null;
  status: "pending" | "approved" | "rejected" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
  admin_notes: string | null;
  created_at: string;
}

export default function AdsManagerClient({ initialAds }: { initialAds: Advertisement[] }) {
  const [ads, setAds] = useState<Advertisement[]>(initialAds);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "approved" | "completed" | "rejected">("pending");
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge>;
      case "approved": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Approved</Badge>;
      case "active": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>;
      case "completed": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
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
            className={`capitalize ${filter === tab ? "bg-upsa-navy text-white hover:bg-upsa-navy/90" : "text-gray-600"}`}
          >
            {tab}
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {tab === "all" ? ads.length : ads.filter(a => a.status === tab).length}
            </span>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAds.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No advertisements found for this filter.</p>
          </div>
        ) : (
          filteredAds.map((ad) => (
            <Card key={ad.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row border-b border-gray-100">
                  {/* Image Section */}
                  <div className="w-full md:w-64 h-40 md:h-auto bg-gray-50 relative border-r border-gray-100 flex items-center justify-center p-4">
                    {ad.banner_image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={ad.banner_image_url} 
                        alt={ad.company_name} 
                        className="max-h-full max-w-full object-contain rounded-md"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">No Image</span>
                    )}
                  </div>

                  {/* Details Section */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-upsa-navy">{ad.company_name}</h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {ad.contact_email} {ad.contact_phone && `• ${ad.contact_phone}`}
                          </p>
                        </div>
                        <StatusBadge status={ad.status} />
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider mb-1">Tier</span>
                          <span className="capitalize">{ad.ad_tier}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider mb-1">Submitted</span>
                          <span>{format(new Date(ad.created_at), "MMM d, yyyy")}</span>
                        </div>
                        {ad.target_url && (
                          <div>
                            <span className="font-semibold text-gray-900 block text-xs uppercase tracking-wider mb-1">Target URL</span>
                            <a href={ad.target_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center">
                              Link <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-50">
                      {ad.status === "pending" && (
                        <>
                          <Button 
                            onClick={() => handleStatusChange(ad.id, "approved")}
                            disabled={loadingId === ad.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            {loadingId === ad.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleStatusChange(ad.id, "rejected")}
                            disabled={loadingId === ad.id}
                            variant="destructive"
                          >
                            {loadingId === ad.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject
                          </Button>
                        </>
                      )}

                      {ad.status === "approved" && (
                        <Button 
                          onClick={() => handleStatusChange(ad.id, "active")}
                          disabled={loadingId === ad.id}
                          className="bg-upsa-gold text-upsa-navy hover:bg-yellow-400"
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
    </div>
  );
}
