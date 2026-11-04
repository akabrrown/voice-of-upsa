"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { SitePageConfig, DEFAULT_SITE_PAGES, mergeWithDefaults, getPageIcon } from "@/lib/site-pages";

export function useSitePages() {
  const [pages, setPages] = useState<SitePageConfig[]>(DEFAULT_SITE_PAGES);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchPages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_pages")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) {
        // Table may not exist yet in dev or offline; fallback cleanly
        setPages(DEFAULT_SITE_PAGES);
      } else if (data) {
        setPages(mergeWithDefaults(data));
      }
    } catch (err) {
      console.warn("Failed to fetch site_pages, using defaults:", err);
      setPages(DEFAULT_SITE_PAGES);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPages();

    // Subscribe to realtime updates on site_pages
    const channel = supabase
      .channel("site_pages_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_pages" },
        () => {
          fetchPages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchPages]);

  const campusLifeNav = useMemo(() => {
    return pages
      .filter((p) => p.section === "campus_life" && p.is_active && p.show_in_nav)
      .map((p) => ({
        ...p,
        icon: getPageIcon(p.icon_name),
      }));
  }, [pages]);

  const communityNav = useMemo(() => {
    return pages
      .filter((p) => p.section === "community" && p.is_active && p.show_in_nav)
      .map((p) => ({
        ...p,
        icon: getPageIcon(p.icon_name),
      }));
  }, [pages]);

  const mainNavLinks = useMemo(() => {
    return pages
      .filter((p) => p.section === "main_nav" && p.is_active && p.show_in_nav)
      .map((p) => ({
        ...p,
        icon: getPageIcon(p.icon_name),
      }));
  }, [pages]);

  const footerLinks = useMemo(() => {
    return pages.filter((p) => p.is_active && p.show_in_footer);
  }, [pages]);

  const isPageActive = useCallback(
    (hrefOrId: string): boolean => {
      const cleanTarget = hrefOrId.replace(/^\//, "").toLowerCase();
      const match = pages.find(
        (p) =>
          p.id.toLowerCase() === cleanTarget ||
          p.href.replace(/^\//, "").toLowerCase() === cleanTarget
      );
      return match ? match.is_active : true;
    },
    [pages]
  );

  const getPageConfig = useCallback(
    (hrefOrId: string): SitePageConfig | undefined => {
      const cleanTarget = hrefOrId.replace(/^\//, "").toLowerCase();
      return pages.find(
        (p) =>
          p.id.toLowerCase() === cleanTarget ||
          p.href.replace(/^\//, "").toLowerCase() === cleanTarget
      );
    },
    [pages]
  );

  return {
    pages,
    campusLifeNav,
    communityNav,
    mainNavLinks,
    footerLinks,
    isPageActive,
    getPageConfig,
    isLoading,
    refresh: fetchPages,
  };
}

