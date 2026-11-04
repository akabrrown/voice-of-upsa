"use client";

import { useSyncExternalStore, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  SitePageConfig,
  DEFAULT_SITE_PAGES,
  mergeWithDefaults,
  getPageIcon,
} from "@/lib/site-pages";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface SitePagesState {
  pages: SitePageConfig[];
  isLoading: boolean;
}

// Module-level singleton store so Navbar, Footer, PageStatusGate, and Admin
// share the same single subscription and in-memory cache without duplicate sockets or channel collision errors.
let globalState: SitePagesState = {
  pages: DEFAULT_SITE_PAGES,
  isLoading: true,
};

const listeners = new Set<() => void>();
let activeChannel: RealtimeChannel | null = null;
let isFetching = false;
let hasInitiatedFetch = false;

function emitChange() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Error in site_pages listener:", e);
    }
  });
}

export async function fetchSitePages(): Promise<SitePageConfig[]> {
  if (typeof window === "undefined") {
    return DEFAULT_SITE_PAGES;
  }
  if (isFetching) {
    return globalState.pages;
  }
  isFetching = true;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("site_pages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // Table may not exist yet or connection error; fallback cleanly to defaults
      globalState = {
        pages: DEFAULT_SITE_PAGES,
        isLoading: false,
      };
    } else if (data) {
      globalState = {
        pages: mergeWithDefaults(data),
        isLoading: false,
      };
    }
  } catch (err) {
    console.warn("Failed to fetch site_pages, using defaults:", err);
    globalState = {
      pages: DEFAULT_SITE_PAGES,
      isLoading: false,
    };
  } finally {
    isFetching = false;
    emitChange();
  }

  return globalState.pages;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  // If this is the very first subscriber, start the initial fetch and set up realtime
  if (listeners.size === 1) {
    if (!hasInitiatedFetch) {
      hasInitiatedFetch = true;
      fetchSitePages();
    }

    try {
      const supabase = createClient();
      const channelName = `site_pages_sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      activeChannel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "site_pages" },
          () => {
            fetchSitePages();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Realtime subscription setup failed:", e);
    }
  }

  return () => {
    listeners.delete(callback);
    // When all components unmount, safely clean up the single realtime channel
    if (listeners.size === 0 && activeChannel) {
      try {
        const supabase = createClient();
        supabase.removeChannel(activeChannel);
      } catch (e) {
        // ignore cleanup error
      }
      activeChannel = null;
    }
  };
}

function getSnapshot(): SitePagesState {
  return globalState;
}

const SERVER_SNAPSHOT: SitePagesState = {
  pages: DEFAULT_SITE_PAGES,
  isLoading: false,
};

function getServerSnapshot(): SitePagesState {
  return SERVER_SNAPSHOT;
}

export function useSitePages() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { pages, isLoading } = state;

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

  const refresh = useCallback(async () => {
    await fetchSitePages();
  }, []);

  return {
    pages,
    campusLifeNav,
    communityNav,
    mainNavLinks,
    footerLinks,
    isPageActive,
    getPageConfig,
    isLoading,
    refresh,
  };
}
