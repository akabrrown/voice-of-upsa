"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Check, 
  X, 
  Eye, 
  Calendar as CalendarIcon,
  ExternalLink,
  Trash2,
  CalendarClock,
  DollarSign,
  Filter,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  Briefcase,
  User,
  Mail,
  Tag,
  Search,
  ChevronRight,
  Flame,
  CheckCircle2,
  Building2,
  Phone,
  Plus,
  Edit3,
  Layers
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { TableShadowLoader } from "@/components/ui/shadow-loaders";

interface AdItem {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  adType: "leaderboard" | "sidebar" | "in-feed";
  creativeUrl: string;
  targetUrl: string;
  packageTier: "basic" | "standard" | "premium";
  status: "pending" | "approved" | "rejected" | "active" | "expired";
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  productName: string;
  productDescription: string;
}

export default function AdManagementPage() {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "active" | "expired" | "rejected">("all");
  
  // Detailed Modal View & Edit state
  const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
  const [modalStartsAt, setModalStartsAt] = useState("");
  const [modalEndsAt, setModalEndsAt] = useState("");
  const [modalStatus, setModalStatus] = useState<AdItem["status"]>("pending");
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Dynamic pricing tiers configuration state
  interface PricingTierItem {
    id: string;
    name: string;
    price: number;
    period: string;
    description?: string;
    features?: string[];
    highlight?: boolean;
    button_text?: string;
    sort_order?: number;
    is_active?: boolean;
  }

  const [pricingTiers, setPricingTiers] = useState<PricingTierItem[]>([]);
  const [isSavingPrices, setIsSavingPrices] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PricingTierItem | null>(null);

  // Form states for tier modal
  const [tierName, setTierName] = useState("");
  const [tierPrice, setTierPrice] = useState<number>(200);
  const [tierPeriod, setTierPeriod] = useState("per week");
  const [tierDescription, setTierDescription] = useState("");
  const [tierFeatures, setTierFeatures] = useState("");
  const [tierHighlight, setTierHighlight] = useState(false);
  const [tierButtonText, setTierButtonText] = useState("Start Advertising");

  const supabase = createClient();

  const fetchPricingTiers = async () => {
    try {
      const res = await fetch("/api/admin/pricing-tiers");
      const data = await res.json();
      if (data.tiers) {
        setPricingTiers(data.tiers);
      }
    } catch (err: any) {
      console.error("Error fetching pricing tiers:", err);
    }
  };

  const handleOpenAddTier = () => {
    setEditingTier(null);
    setTierName("");
    setTierPrice(200);
    setTierPeriod("per week");
    setTierDescription("");
    setTierFeatures("Sidebar Ad (300x250)\nStandard Placement\nWeekly Analytics\nUp to 10,000 Impressions");
    setTierHighlight(false);
    setTierButtonText("Start Advertising");
    setIsTierModalOpen(true);
  };

  const handleOpenEditTier = (tier: PricingTierItem) => {
    setEditingTier(tier);
    setTierName(tier.name);
    setTierPrice(tier.price);
    setTierPeriod(tier.period);
    setTierDescription(tier.description || "");
    setTierFeatures(Array.isArray(tier.features) ? tier.features.join("\n") : "");
    setTierHighlight(Boolean(tier.highlight));
    setTierButtonText(tier.button_text || "Start Advertising");
    setIsTierModalOpen(true);
  };

  const handleSaveTierModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim()) {
      toast.error("Plan name is required");
      return;
    }

    setIsSavingPrices(true);
    const parsedFeatures = tierFeatures
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      id: editingTier?.id || tierName.toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
      name: tierName.trim(),
      price: Number(tierPrice),
      period: tierPeriod.trim() || "per week",
      description: tierDescription.trim(),
      features: parsedFeatures,
      highlight: tierHighlight,
      button_text: tierButtonText.trim() || "Start Advertising",
    };

    try {
      const method = editingTier ? "PUT" : "POST";
      const res = await fetch("/api/admin/pricing-tiers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save pricing plan");

      toast.success(editingTier ? "Plan updated successfully!" : "New pricing plan created!");
      setIsTierModalOpen(false);
      fetchPricingTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to save plan");
    } finally {
      setIsSavingPrices(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this pricing plan?")) return;

    try {
      const res = await fetch(`/api/admin/pricing-tiers?id=${tierId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plan");

      toast.success("Pricing plan removed");
      fetchPricingTiers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete plan");
    }
  };

  const fetchAds = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setAds(
          data.map((ad: any) => ({
            id: ad.id,
            companyName: ad.company_name,
            contactName: ad.contact_name,
            contactEmail: ad.contact_email,
            contactPhone: ad.contact_phone || "",
            adType: ad.ad_type,
            creativeUrl: ad.creative_url || "",
            targetUrl: ad.target_url || "",
            packageTier: ad.package_tier || "basic",
            status: ad.status || "pending",
            startsAt: ad.starts_at || null,
            endsAt: ad.ends_at || null,
            createdAt: ad.created_at,
            productName: ad.product_name || "",
            productDescription: ad.product_description || "",
          }))
        );
      }
    } catch (err: any) {
      console.error("Error fetching ads:", err);
      toast.error(err.message || "Failed to load advertisements");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAds();
    fetchPricingTiers();
  }, [supabase]);

  // Handle setting/editing fields inside modal
  const openModal = (ad: AdItem) => {
    setSelectedAd(ad);
    setModalStatus(ad.status);
    setModalStartsAt(ad.startsAt ? ad.startsAt.split("T")[0] : "");
    setModalEndsAt(ad.endsAt ? ad.endsAt.split("T")[0] : "");
  };

  const closeModal = () => {
    setSelectedAd(null);
  };

  // Perform specific quick status updates directly from table row
  const handleUpdateStatus = async (adId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ status: newStatus })
        .eq("id", adId);

      if (error) throw error;

      toast.success(`Advertisement set to ${newStatus}!`);
      fetchAds(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update ad status");
    }
  };

  // Save the full configuration in Modal (including schedules)
  const handleSaveCampaign = async () => {
    if (!selectedAd) return;

    setIsModalSaving(true);
    try {
      const updates: Record<string, any> = {
        status: modalStatus,
        starts_at: modalStartsAt ? new Date(modalStartsAt).toISOString() : null,
        ends_at: modalEndsAt ? new Date(modalEndsAt).toISOString() : null,
      };

      const { error } = await supabase
        .from("advertisements")
        .update(updates)
        .eq("id", selectedAd.id);

      if (error) throw error;

      toast.success("Campaign updated successfully!");
      closeModal();
      fetchAds(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update campaign");
    } finally {
      setIsModalSaving(false);
    }
  };

  // Handle advertisement deletion
  const handleDeleteAd = async (adId: string) => {
    if (!confirm("Are you sure you want to permanently delete this advertisement campaign? This action is irreversible.")) return;

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", adId);

      if (error) throw error;

      toast.success("Advertisement campaign deleted.");
      closeModal();
      fetchAds(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete advertisement");
    }
  };

  // Compute metrics from ads
  const stats = useMemo(() => {
    const total = ads.length;
    const pending = ads.filter(a => a.status === "pending").length;
    const active = ads.filter(a => a.status === "active").length;
    
    // Estimate weekly revenue based on active/approved tiers
    const revenue = ads
      .filter(a => a.status === "active" || a.status === "approved")
      .reduce((sum, a) => {
        const tier = pricingTiers.find(t => t.id === a.packageTier);
        return sum + (tier?.price || 0);
      }, 0);

    return { total, pending, active, revenue };
  }, [ads, pricingTiers]);

  // Filter ads based on search query and active tab
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = 
        ad.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.contactName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab = activeTab === "all" || ad.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [ads, searchQuery, activeTab]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight uppercase">Campaign & Ad Management</h1>
          <p className="text-gray-500 mt-1">Configure active slots, inspect product campaigns, schedule runs, and review sponsor creative items.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchAds(true)}
          disabled={isRefreshing}
          className="self-start md:self-center bg-white border-gray-200 hover:border-upsa-navy font-bold rounded-xl gap-2 flex items-center px-4"
        >
          <RefreshCw className={cn("h-4 w-4 text-gray-500", isRefreshing && "animate-spin text-upsa-navy")} />
          Refresh
        </Button>
      </div>

      {/* Analytics / Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Campaigns */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-gray-50 rounded-2xl text-upsa-navy">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Submissions</p>
            <h3 className="text-2xl font-black text-upsa-navy mt-0.5">{stats.total}</h3>
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className={cn("p-3.5 rounded-2xl", stats.pending > 0 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-400")}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Moderation</p>
            <h3 className={cn("text-2xl font-black mt-0.5", stats.pending > 0 ? "text-amber-600 animate-pulse" : "text-gray-500")}>
              {stats.pending}
            </h3>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className={cn("p-3.5 rounded-2xl", stats.active > 0 ? "bg-emerald-50 text-emerald-600 animate-pulse" : "bg-gray-50 text-gray-400")}>
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Currently Running</p>
            <h3 className="text-2xl font-black text-upsa-navy mt-0.5">{stats.active}</h3>
          </div>
        </div>

        {/* Weekly Revenue Estimate */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Est. Weekly Revenue</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">GH₵ {stats.revenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Dynamic pricing controller panel */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-upsa-navy tracking-tight uppercase flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-upsa-gold" />
                Advertising Subscription Plans
              </h2>
              <span className="bg-upsa-gold/15 text-upsa-navy text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                {pricingTiers.length} Active Plans
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Create and edit advertisement plans, custom tier pricing, billing frequencies, and features shown on the public site.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => fetchPricingTiers()} 
              className="border-gray-200 text-xs font-bold text-gray-600 rounded-xl gap-1.5 h-9"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button 
              onClick={handleOpenAddTier} 
              className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl text-xs gap-2 py-5 shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" /> Create Pricing Plan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all duration-300 ${
                tier.highlight 
                  ? "bg-upsa-navy/5 border-upsa-gold/40 shadow-sm" 
                  : "bg-gray-50/50 border-gray-100"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-upsa-gold" />
                    <h3 className="text-sm font-black text-upsa-navy uppercase tracking-wider">
                      {tier.name}
                    </h3>
                  </div>

                  {tier.highlight && (
                    <span className="bg-upsa-gold text-upsa-navy text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 my-3">
                  <span className="text-2xl font-black text-upsa-navy">GH₵ {tier.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-medium">/{tier.period}</span>
                </div>

                {tier.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {tier.description}
                  </p>
                )}

                {tier.features && tier.features.length > 0 && (
                  <ul className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                    {tier.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 truncate">
                        <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </li>
                    ))}
                    {tier.features.length > 3 && (
                      <li className="text-[10px] text-gray-400 italic font-medium">
                        +{tier.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditTier(tier)}
                  className="rounded-xl text-xs font-bold gap-1.5 h-8 border-gray-200 hover:border-upsa-navy hover:text-upsa-navy"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Plan
                </Button>

                {!["basic", "standard", "premium"].includes(tier.id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTier(tier.id)}
                    className="rounded-xl text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4 items-center">
          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-1.5 self-stretch overflow-x-auto pb-2 lg:pb-0">
            {[
              { id: "all", label: "All Campaigns" },
              { id: "pending", label: "Pending Approval" },
              { id: "approved", label: "Approved" },
              { id: "active", label: "Active/Running" },
              { id: "expired", label: "Completed/Expired" },
              { id: "rejected", label: "Rejected" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-upsa-navy text-white shadow-sm"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                )}
              >
                {tab.label}
                {tab.id === "pending" && stats.pending > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search company, product, advertiser..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs border-gray-200 rounded-xl focus:border-upsa-navy focus:ring-1 focus:ring-upsa-navy/20"
            />
          </div>
        </div>

        {/* Advertisements Table */}
        <div className="overflow-hidden border border-gray-100 rounded-2xl bg-white">
          {isLoading ? (
            <div className="p-6">
              <TableShadowLoader rows={5} hasSearch={false} />
            </div>
          ) : filteredAds.length > 0 ? (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Brand / Company</TableHead>
                  <TableHead className="font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Campaign Product</TableHead>
                  <TableHead className="font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Contact Details</TableHead>
                  <TableHead className="font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Unit Spec & Tier</TableHead>
                  <TableHead className="font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Status</TableHead>
                  <TableHead className="font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Duration Schedule</TableHead>
                  <TableHead className="text-right font-bold text-upsa-navy text-xs uppercase tracking-wider py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad) => (
                  <TableRow key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Brand */}
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-upsa-navy text-sm">{ad.companyName}</span>
                        {ad.targetUrl && (
                          <a 
                            href={ad.targetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-gray-300 hover:text-upsa-gold transition-colors"
                            title="Visit Target Link"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block mt-0.5">ID: {ad.id.substring(0, 8)}...</span>
                    </TableCell>

                    {/* Product / Service */}
                    <TableCell className="py-4">
                      <p className="font-medium text-xs text-gray-700 max-w-[180px] truncate" title={ad.productName}>
                        {ad.productName || <span className="italic text-gray-400">Not specified</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[180px]" title={ad.productDescription}>
                        {ad.productDescription || <span className="italic">No description</span>}
                      </p>
                    </TableCell>

                    {/* Contact details */}
                    <TableCell className="py-4">
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-gray-700">{ad.contactName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{ad.contactEmail}</p>
                      </div>
                    </TableCell>

                    {/* Unit Spec & Tier */}
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="outline" className="capitalize text-[9px] tracking-wider font-extrabold text-upsa-navy border-gray-200">
                          {ad.adType}
                        </Badge>
                        <Badge 
                          className={cn(
                            "capitalize text-[9px] tracking-wider font-extrabold border shadow-none",
                            ad.packageTier === "premium" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            ad.packageTier === "standard" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-gray-50 text-gray-600 border-gray-200"
                          )}
                        >
                          {ad.packageTier} Tier
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4">
                      <Badge 
                        className={cn(
                          "capitalize font-bold text-[9px] tracking-wider px-2 py-0.5 shadow-sm text-white border-0",
                          ad.status === "active" ? "bg-emerald-500" : 
                          ad.status === "approved" ? "bg-blue-500" : 
                          ad.status === "pending" ? "bg-amber-500" : 
                          ad.status === "expired" ? "bg-gray-500" : 
                          "bg-red-500"
                        )}
                      >
                        {ad.status}
                      </Badge>
                    </TableCell>

                    {/* Schedule */}
                    <TableCell className="py-4 text-xs text-gray-500 font-medium">
                      {ad.startsAt || ad.endsAt ? (
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block shrink-0" />
                            {ad.startsAt ? new Date(ad.startsAt).toLocaleDateString() : "Immediate"}
                          </p>
                          <p className="flex items-center gap-1.5 text-[10px] text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 block shrink-0" />
                            {ad.endsAt ? new Date(ad.endsAt).toLocaleDateString() : "Ongoing"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px] flex items-center gap-1">
                          <CalendarClock className="h-3.5 w-3.5 text-gray-300" />
                          Unscheduled
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* View/Edit Config Button */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2.5 border-gray-100 hover:border-upsa-navy text-xs gap-1 text-gray-600 font-bold"
                          onClick={() => openModal(ad)}
                          title="View Details & Schedule"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                        
                        {/* Inline fast moderation controls */}
                        {ad.status === "pending" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 border-emerald-100 hover:bg-emerald-50 text-emerald-600"
                              onClick={() => handleUpdateStatus(ad.id, "approved")}
                              title="Approve Submission"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 border-red-100 hover:bg-red-50 text-red-600"
                              onClick={() => handleUpdateStatus(ad.id, "rejected")}
                              title="Reject Submission"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {ad.status === "approved" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-[10px] uppercase font-bold flex items-center gap-1"
                            onClick={() => handleUpdateStatus(ad.id, "active")}
                          >
                            <Play className="h-3 w-3" /> Run Ad
                          </Button>
                        )}

                        {ad.status === "active" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 border-amber-200 text-amber-600 hover:bg-amber-50 text-[10px] uppercase font-bold flex items-center gap-1"
                            onClick={() => handleUpdateStatus(ad.id, "approved")}
                          >
                            <Pause className="h-3 w-3" /> Pause
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteAd(ad.id)}
                          title="Delete submission permanently"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20 text-center text-gray-400 italic text-xs font-bold bg-white">
              No advertisements found matching current filter context.
            </div>
          )}
        </div>
      </div>

      {/* Advanced Campaign Moderation & Schedule Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={closeModal}>
          <div 
            className="bg-white rounded-2xl p-6 sm:p-10 max-w-4xl w-full border border-gray-100 shadow-2xl space-y-6 my-8" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="text-2xl font-black text-upsa-navy uppercase tracking-tight">Campaign Console</h3>
                <p className="text-xs text-gray-400 mt-1">Review, approve, and configure schedule parameters for <span className="font-bold text-gray-600">{selectedAd.companyName}</span></p>
              </div>
              <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 hover:bg-gray-100" onClick={closeModal}>
                <X className="h-5 w-5 text-gray-400" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Information Display */}
              <div className="space-y-6">
                
                {/* Brand & Contact details */}
                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-upsa-navy uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Advertiser Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Company Name</span>
                      <p className="font-bold text-gray-700 mt-0.5">{selectedAd.companyName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Contact Person</span>
                      <p className="font-bold text-gray-700 mt-0.5">{selectedAd.contactName}</p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Email Address</span>
                      <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1.5 overflow-hidden text-ellipsis">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedAd.contactEmail}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Phone Number</span>
                      <p className="font-medium text-gray-700 mt-0.5 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        {selectedAd.contactPhone || <span className="italic text-gray-400">N/A</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Campaign Product & Details */}
                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-upsa-navy uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" /> Product & Banner specs
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Campaign Product/Service</span>
                      <p className="font-bold text-gray-700 mt-0.5">
                        {selectedAd.productName || <span className="italic text-gray-400">Not specified</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Product/Campaign Description</span>
                      <p className="text-gray-600 leading-relaxed mt-0.5 font-light max-h-24 overflow-y-auto pr-1">
                        {selectedAd.productDescription || <span className="italic text-gray-400">No description provided</span>}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Package Tier</span>
                        <p className="font-extrabold text-upsa-navy uppercase mt-0.5 tracking-wider flex items-center gap-1">
                          <Tag className="h-3 w-3 text-upsa-gold" />
                          {selectedAd.packageTier} (GH₵ {pricingTiers.find(t => t.id === selectedAd.packageTier)?.price || 0} {pricingTiers.find(t => t.id === selectedAd.packageTier)?.period || ""})
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Placement Slot</span>
                        <p className="font-bold text-gray-600 mt-0.5 capitalize">{selectedAd.adType}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Moderation, Dates & Preview */}
              <div className="space-y-6">
                
                {/* Moderation Controls & Date Configuration */}
                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-upsa-navy uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" /> Schedule & Moderation
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Status selection */}
                    <div className="space-y-1.5">
                      <Label htmlFor="campaign-status" className="text-[10px] font-black uppercase text-gray-400">Campaign Status</Label>
                      <select 
                        id="campaign-status"
                        value={modalStatus} 
                        onChange={(e) => setModalStatus(e.target.value as any)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-upsa-navy focus:outline-none"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved (Paused)</option>
                        <option value="active">Active (Running)</option>
                        <option value="expired">Expired/Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="starts-at" className="text-[10px] font-black uppercase text-gray-400">Starts At</Label>
                        <input
                          id="starts-at"
                          type="date"
                          value={modalStartsAt}
                          onChange={(e) => setModalStartsAt(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:border-upsa-navy focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ends-at" className="text-[10px] font-black uppercase text-gray-400">Ends At</Label>
                        <input
                          id="ends-at"
                          type="date"
                          value={modalEndsAt}
                          onChange={(e) => setModalEndsAt(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:border-upsa-navy focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Creative Preview */}
                <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-100 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-upsa-navy uppercase tracking-wider">Banner Creative</h4>
                    {selectedAd.targetUrl && (
                      <a 
                        href={selectedAd.targetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-upsa-navy hover:text-upsa-gold font-bold flex items-center gap-1 transition-colors"
                      >
                        Test link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {selectedAd.creativeUrl ? (
                    <div className="relative group overflow-hidden bg-white border rounded-2xl p-2 flex items-center justify-center min-h-[140px] max-h-[180px] shadow-inner">
                      <img 
                        src={selectedAd.creativeUrl} 
                        alt="Creative Creative" 
                        className="max-w-full max-h-[160px] object-contain rounded-xl"
                      />
                      <a 
                        href={selectedAd.creativeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 rounded-2xl"
                      >
                        Open Original Creative <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    <div className="py-10 bg-white border border-dashed rounded-2xl text-center text-xs text-gray-400 font-bold">
                      No ad banner upload found.
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Modal Footer actions */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 pt-6 border-t">
              <Button 
                variant="ghost" 
                onClick={() => handleDeleteAd(selectedAd.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold rounded-xl text-xs gap-1.5 px-4 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4" /> Delete Submission
              </Button>
              
              <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={closeModal}
                  className="bg-white border-gray-200 font-bold rounded-xl text-xs px-5 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveCampaign}
                  disabled={isModalSaving}
                  className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl text-xs px-6 w-full sm:w-auto transition-all"
                >
                  {isModalSaving ? "Saving..." : "Save Campaign"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Create / Edit Pricing Plan Dialog */}
      <Dialog open={isTierModalOpen} onOpenChange={setIsTierModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-upsa-navy flex items-center gap-2">
              <Tag className="h-5 w-5 text-upsa-gold" />
              {editingTier ? "Edit Pricing Plan" : "Create New Pricing Plan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Customize tier cost, billing cycle, description, and feature list displayed across the advertising portal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTierModal} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="tier_name" className="text-xs font-bold text-upsa-navy">
                Plan Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tier_name"
                value={tierName}
                onChange={(e) => setTierName(e.target.value)}
                placeholder="e.g. Campus Spotlight or Semester Pass"
                required
                className="rounded-xl text-xs border-gray-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tier_price" className="text-xs font-bold text-upsa-navy">
                  Rate (GH₵) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tier_price"
                  type="number"
                  value={tierPrice}
                  onChange={(e) => setTierPrice(Number(e.target.value))}
                  placeholder="500"
                  required
                  min={0}
                  className="rounded-xl text-xs border-gray-200 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tier_period" className="text-xs font-bold text-upsa-navy">
                  Billing Cycle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tier_period"
                  value={tierPeriod}
                  onChange={(e) => setTierPeriod(e.target.value)}
                  placeholder="per week"
                  required
                  className="rounded-xl text-xs border-gray-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tier_desc" className="text-xs font-bold text-upsa-navy">
                Description
              </Label>
              <Input
                id="tier_desc"
                value={tierDescription}
                onChange={(e) => setTierDescription(e.target.value)}
                placeholder="Short tagline or summary of the target advertiser..."
                className="rounded-xl text-xs border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tier_features" className="text-xs font-bold text-upsa-navy">
                Features List (One per line)
              </Label>
              <Textarea
                id="tier_features"
                value={tierFeatures}
                onChange={(e) => setTierFeatures(e.target.value)}
                rows={4}
                placeholder="Leaderboard Ad (728x90)&#10;Social Media Mention&#10;Detailed Analytics Report"
                className="rounded-xl text-xs border-gray-200"
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="space-y-0.5">
                <Label htmlFor="tier_highlight_toggle" className="text-xs font-bold text-upsa-navy cursor-pointer">
                  Featured / Recommended
                </Label>
                <p className="text-[10px] text-gray-400">
                  Adds a &quot;Recommended&quot; highlight badge on the public pricing page.
                </p>
              </div>
              <input
                id="tier_highlight_toggle"
                type="checkbox"
                checked={tierHighlight}
                onChange={(e) => setTierHighlight(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-gold"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTierModalOpen(false)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingPrices}
                className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold rounded-xl text-xs cursor-pointer"
              >
                {isSavingPrices ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {editingTier ? "Update Plan" : "Save New Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

