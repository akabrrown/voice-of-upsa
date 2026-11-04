"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { 
  SitePageConfig, 
  DEFAULT_SITE_PAGES, 
  mergeWithDefaults, 
  getPageIcon, 
  PageSection 
} from "@/lib/site-pages";
import { 
  Globe, 
  Search, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Sparkles, 
  Menu, 
  Layers, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  Loader2
} from "lucide-react";

export default function AdminNavigationManagerPage() {
  const [pages, setPages] = useState<SitePageConfig[]>(DEFAULT_SITE_PAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const supabase = createClient();

  // Load pages from Supabase with graceful fallback
  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        console.warn("Could not fetch site_pages from database, using defaults:", error.message);
        setPages(DEFAULT_SITE_PAGES);
      } else if (data && data.length > 0) {
        setPages(mergeWithDefaults(data));
      } else {
        setPages(DEFAULT_SITE_PAGES);
      }
    } catch (err) {
      console.error("Error fetching site_pages:", err);
      setPages(DEFAULT_SITE_PAGES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  // Update a single field on a page
  const updatePageSetting = async (
    id: string, 
    field: "is_active" | "show_in_nav" | "show_in_footer" | "maintenance_message", 
    value: boolean | string
  ) => {
    // 1. Optimistic UI update
    const updatedPages = pages.map((page) => {
      if (page.id === id) {
        return { ...page, [field]: value };
      }
      return page;
    });
    setPages(updatedPages);

    const targetPage = updatedPages.find((p) => p.id === id);
    if (!targetPage) return;

    try {
      // 2. Persist to Supabase
      const { error } = await supabase
        .from("site_pages")
        .upsert({
          id: targetPage.id,
          title: targetPage.title,
          href: targetPage.href,
          section: targetPage.section,
          description: targetPage.description,
          icon_name: targetPage.icon_name,
          is_active: targetPage.is_active,
          show_in_nav: targetPage.show_in_nav,
          show_in_footer: targetPage.show_in_footer,
          maintenance_message: targetPage.maintenance_message,
          sort_order: targetPage.sort_order,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      if (field === "is_active") {
        toast.success(
          value 
            ? `"${targetPage.title}" is now ACTIVE on the live site.` 
            : `"${targetPage.title}" is now INACTIVE. Visitors will see the Coming Soon notice.`
        );
      } else if (field === "show_in_nav") {
        toast.success(
          value 
            ? `"${targetPage.title}" added to Navigation Menu.` 
            : `"${targetPage.title}" hidden from Navigation Menu.`
        );
      } else if (field === "show_in_footer") {
        toast.success(
          value 
            ? `"${targetPage.title}" added to Footer Links.` 
            : `"${targetPage.title}" hidden from Footer Links.`
        );
      } else if (field === "maintenance_message") {
        toast.success(`Updated maintenance message for "${targetPage.title}".`);
      }
    } catch (err: any) {
      console.error("Failed to save site page configuration:", err);
      toast.error(err.message || "Failed to sync setting with database.");
    }
  };

  // Bulk activate all pages
  const handleActivateAll = async () => {
    if (!confirm("Are you sure you want to activate ALL pages and show their navigation links on the live site?")) return;

    setIsSaving(true);
    const updated = pages.map((p) => ({
      ...p,
      is_active: true,
      show_in_nav: true,
      show_in_footer: true,
    }));
    setPages(updated);

    try {
      const recordsToUpsert = updated.map((p) => ({
        id: p.id,
        title: p.title,
        href: p.href,
        section: p.section,
        description: p.description,
        icon_name: p.icon_name,
        is_active: true,
        show_in_nav: true,
        show_in_footer: true,
        maintenance_message: p.maintenance_message,
        sort_order: p.sort_order,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("site_pages").upsert(recordsToUpsert);
      if (error) throw error;

      toast.success("All pages and navigation buttons activated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate all pages.");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default configuration
  const handleResetDefaults = async () => {
    if (!confirm("Reset all pages and navigation links back to initial system defaults?")) return;

    setIsSaving(true);
    setPages(DEFAULT_SITE_PAGES);

    try {
      const recordsToUpsert = DEFAULT_SITE_PAGES.map((p) => ({
        ...p,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("site_pages").upsert(recordsToUpsert);
      if (error) throw error;

      toast.success("Pages and navigation reset to defaults!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset to defaults.");
    } finally {
      setIsSaving(false);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = pages.length;
    const active = pages.filter((p) => p.is_active).length;
    const inactive = total - active;
    const inNav = pages.filter((p) => p.is_active && p.show_in_nav).length;
    return { total, active, inactive, inNav };
  }, [pages]);

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.href.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (page.description && page.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSection = sectionFilter === "all" || page.section === sectionFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && page.is_active) ||
        (statusFilter === "inactive" && !page.is_active);

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [pages, searchQuery, sectionFilter, statusFilter]);

  const getSectionBadge = (section: PageSection) => {
    switch (section) {
      case "campus_life":
        return <Badge variant="outline" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20 font-bold">Campus Life</Badge>;
      case "community":
        return <Badge variant="outline" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 font-bold">Community</Badge>;
      case "main_nav":
        return <Badge variant="outline" className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20 font-bold">Top Nav</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold">Footer</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-upsa-gold/15 text-upsa-navy dark:text-upsa-gold text-xs font-bold uppercase tracking-wider mb-2">
            <Globe className="h-3.5 w-3.5" /> Site Experience Management
          </div>
          <h1 className="text-3xl font-black text-upsa-navy dark:text-white tracking-tight">
            Pages & Navigation Manager
          </h1>
          <p className="text-gray-500 dark:text-slate-400">
            Control which pages and navigation buttons are active or inactive on the live website. Inactive pages show a polished coming soon notice to visitors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleResetDefaults} 
            disabled={isSaving}
            className="border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Defaults
          </Button>
          <Button 
            onClick={handleActivateAll} 
            disabled={isSaving}
            className="bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-amber-400 font-bold transition-colors"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Activate All Pages
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-gray-100 dark:border-white/10 shadow-sm bg-white dark:bg-[#0C1729]">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pages</span>
            <div className="text-2xl font-black text-upsa-navy dark:text-white mt-1">{metrics.total}</div>
            <span className="text-xs text-gray-400 mt-1 block">Configured routes</span>
          </CardContent>
        </Card>

        <Card className="border border-emerald-100 dark:border-emerald-950/40 shadow-sm bg-white dark:bg-[#0C1729]">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Pages</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.active}</div>
            <span className="text-xs text-gray-400 mt-1 block">Live for all visitors</span>
          </CardContent>
        </Card>

        <Card className="border border-amber-100 dark:border-amber-950/40 shadow-sm bg-white dark:bg-[#0C1729]">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Inactive / Hidden</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{metrics.inactive}</div>
            <span className="text-xs text-gray-400 mt-1 block">Coming soon notice</span>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 dark:border-white/10 shadow-sm bg-white dark:bg-[#0C1729]">
          <CardContent className="p-5">
            <span className="text-xs font-bold text-upsa-navy dark:text-upsa-gold uppercase tracking-wider">In Navigation</span>
            <div className="text-2xl font-black text-upsa-navy dark:text-upsa-gold mt-1">{metrics.inNav}</div>
            <span className="text-xs text-gray-400 mt-1 block">Buttons in menus</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-gray-100 dark:border-white/10 shadow-sm bg-white dark:bg-[#0C1729]">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by page name, route (/podcasts), or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-50 dark:bg-[#060D1A] border-gray-200 dark:border-white/10 dark:text-white text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Section tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#060D1A] p-1 rounded-xl">
              <button 
                onClick={() => setSectionFilter("all")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sectionFilter === 'all' ? 'bg-white dark:bg-[#0C1729] text-upsa-navy dark:text-upsa-gold shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                All
              </button>
              <button 
                onClick={() => setSectionFilter("campus_life")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sectionFilter === 'campus_life' ? 'bg-white dark:bg-[#0C1729] text-upsa-navy dark:text-upsa-gold shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Campus Life
              </button>
              <button 
                onClick={() => setSectionFilter("community")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sectionFilter === 'community' ? 'bg-white dark:bg-[#0C1729] text-upsa-navy dark:text-upsa-gold shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Community
              </button>
              <button 
                onClick={() => setSectionFilter("main_nav")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${sectionFilter === 'main_nav' ? 'bg-white dark:bg-[#0C1729] text-upsa-navy dark:text-upsa-gold shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Top Nav
              </button>
            </div>

            {/* Status select */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#060D1A] p-1 rounded-xl">
              <button 
                onClick={() => setStatusFilter("all")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-[#0C1729] text-upsa-navy dark:text-upsa-gold shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                All Status
              </button>
              <button 
                onClick={() => setStatusFilter("active")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'active' ? 'bg-white dark:bg-[#0C1729] text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter("inactive")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${statusFilter === 'inactive' ? 'bg-white dark:bg-[#0C1729] text-amber-600 dark:text-amber-400 shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
              >
                Inactive
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-upsa-navy dark:text-upsa-gold" />
            <p className="text-gray-500 text-sm">Loading page configurations...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <Card className="py-16 text-center border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1729]">
            <CardContent>
              <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">No matching pages found</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Try adjusting your search query or filters.</p>
            </CardContent>
          </Card>
        ) : (
          filteredPages.map((page) => {
            const Icon = getPageIcon(page.icon_name);
            const isExpanded = expandedMessageId === page.id;

            return (
              <Card 
                key={page.id} 
                className={`border transition-all bg-white dark:bg-[#0C1729] overflow-hidden ${
                  page.is_active 
                    ? "border-gray-200/90 dark:border-white/10 shadow-xs hover:border-upsa-gold/40" 
                    : "border-amber-200/70 dark:border-amber-500/20 bg-amber-50/20 dark:bg-amber-950/5 shadow-xs"
                }`}
              >
                <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Page details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-2xl shrink-0 transition-transform ${
                      page.is_active 
                        ? "bg-upsa-navy/5 text-upsa-navy dark:bg-upsa-gold/10 dark:text-upsa-gold" 
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg font-black text-upsa-navy dark:text-white tracking-tight">
                          {page.title}
                        </h3>
                        {getSectionBadge(page.section)}
                        {page.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Live & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                            <EyeOff className="h-3 w-3" /> Inactive / Coming Soon
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <code className="bg-gray-100 dark:bg-[#060D1A] px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 font-mono">
                          {page.href}
                        </code>
                        <span>•</span>
                        <span>{page.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Controls & Switches */}
                  <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-white/10 justify-between lg:justify-end">
                    {/* Toggle: Page Active */}
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Page Status
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={page.is_active} 
                          onChange={(e) => updatePageSetting(page.id, "is_active", e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 dark:peer-checked:bg-emerald-500"></div>
                      </label>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {page.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Toggle: Show in Navbar */}
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Show in Nav
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={page.show_in_nav} 
                          onChange={(e) => updatePageSetting(page.id, "show_in_nav", e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy dark:peer-checked:bg-upsa-gold"></div>
                      </label>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {page.show_in_nav ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    {/* Toggle: Show in Footer */}
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Show in Footer
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={page.show_in_footer} 
                          onChange={(e) => updatePageSetting(page.id, "show_in_footer", e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-upsa-navy dark:peer-checked:bg-upsa-gold"></div>
                      </label>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5">
                        {page.show_in_footer ? "Visible" : "Hidden"}
                      </span>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex items-center gap-2 pl-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedMessageId(isExpanded ? null : page.id)}
                        className={`h-9 px-2.5 text-xs font-semibold ${isExpanded ? "bg-upsa-gold/15 text-upsa-navy dark:text-upsa-gold" : "text-gray-600 dark:text-slate-300"}`}
                        title="Edit Inactive Message"
                      >
                        <MessageSquareQuote className="h-4 w-4 mr-1.5" />
                        Notice
                        {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                      </Button>

                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline" 
                        className="h-9 px-2.5 text-xs border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/5"
                      >
                        <Link href={page.href} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Preview
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Maintenance Message Editor */}
                {isExpanded && (
                  <div className="bg-gray-50/80 dark:bg-[#060D1A]/80 border-t border-gray-100 dark:border-white/10 p-5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-upsa-navy dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquareQuote className="h-4 w-4 text-upsa-gold" />
                        Custom Notice for Visitors when Inactive
                      </Label>
                      <span className="text-[11px] text-gray-400">
                        Shown to regular visitors on the Coming Soon screen
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        defaultValue={page.maintenance_message || ""}
                        placeholder="e.g. We are curating new content for this section! Check back next Friday."
                        id={`msg-input-${page.id}`}
                        className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 dark:text-white text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`msg-input-${page.id}`) as HTMLInputElement;
                          if (input) {
                            updatePageSetting(page.id, "maintenance_message", input.value);
                          }
                        }}
                        className="bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy font-bold shrink-0"
                      >
                        Save Notice
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

