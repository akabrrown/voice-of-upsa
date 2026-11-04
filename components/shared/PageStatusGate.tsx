"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSitePages } from "@/hooks/useSitePages";
import { getPageIcon } from "@/lib/site-pages";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Newspaper, Sparkles, Settings } from "lucide-react";

interface PageStatusGateProps {
  pageKey: string;
  fallbackTitle?: string;
  children: React.ReactNode;
}

export function PageStatusGate({
  pageKey,
  fallbackTitle,
  children,
}: PageStatusGateProps) {
  const { getPageConfig, isLoading } = useSitePages();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const supabase = createClient();

  const pageConfig = getPageConfig(pageKey);
  const isPageInactive = pageConfig ? !pageConfig.is_active : false;

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role === "admin" || profile?.role === "developer") {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        // Fallback to non-admin
      } finally {
        setCheckingAuth(false);
      }
    };
    checkRole();
  }, [supabase]);

  // While loading initial configs, pass through to avoid layout flicker
  if (isLoading || checkingAuth) {
    return <>{children}</>;
  }

  // Active page: render children normally
  if (!isPageInactive) {
    return <>{children}</>;
  }

  // Inactive page, but user is Admin: allow preview with top warning banner
  if (isAdmin) {
    return (
      <div className="relative w-full">
        <div className="sticky top-20 z-40 bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs font-medium flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>Admin Preview Mode:</strong> The <strong>{pageConfig?.title || fallbackTitle || pageKey}</strong> page is currently marked as <strong>INACTIVE</strong> for public visitors.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs bg-white dark:bg-[#0C1729] border-amber-400 dark:border-amber-600 font-bold hover:bg-amber-50 dark:hover:bg-amber-950/40">
            <Link href="/dashboard/admin/navigation">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Manage Status
            </Link>
          </Button>
        </div>
        {children}
      </div>
    );
  }

  // Inactive page for regular visitors: show polished Coming Soon / Inactive screen
  const Icon = getPageIcon(pageConfig?.icon_name);
  const displayTitle = pageConfig?.title || fallbackTitle || "Feature";
  const message =
    pageConfig?.maintenance_message ||
    "This section is currently inactive as our team updates content and prepares new experiences. Please check back soon!";

  return (
    <div className="flex-grow flex items-center justify-center container mx-auto px-4 py-20 min-h-[60vh]">
      <Card className="max-w-xl w-full border border-gray-200/80 dark:border-white/10 shadow-2xl bg-white dark:bg-[#0C1729] rounded-3xl overflow-hidden text-center p-8 md:p-12 relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-upsa-navy via-upsa-gold to-upsa-navy" />
        
        <CardContent className="pt-4 space-y-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-upsa-gold/15 dark:bg-upsa-gold/10 border border-upsa-gold/30 flex items-center justify-center text-upsa-navy dark:text-upsa-gold shadow-inner">
            <Icon className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sparkles className="h-3 w-3" /> Under Active Preparation
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-upsa-navy dark:text-white tracking-tight">
              {displayTitle} Coming Soon
            </h1>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed max-w-md mx-auto">
            {message}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-amber-400 font-bold px-6">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold">
              <Link href="/categories/all">
                <Newspaper className="mr-2 h-4 w-4" /> Browse Campus News
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
