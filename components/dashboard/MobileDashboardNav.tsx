"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Users, 
  Settings, 
  BarChart3, 
  Megaphone,
  CalendarHeart,
  Store,
} from "lucide-react";

const editorLinks = [
  { name: "Overview", href: "/dashboard/editor", icon: LayoutDashboard },
  { name: "My Articles", href: "/dashboard/editor/articles", icon: FileText },
  { name: "Create New", href: "/dashboard/editor/articles/new", icon: PlusCircle },
];

const adminLinks = [
  { name: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "Articles", href: "/dashboard/admin/articles", icon: FileText },
  { name: "Editorial Team", href: "/dashboard/admin/team", icon: Users },
  { name: "Users", href: "/dashboard/admin/users", icon: Users },
  { name: "Ads", href: "/dashboard/admin/ads", icon: Megaphone },
  { name: "Holiday Wishes", href: "/dashboard/admin/holidays", icon: CalendarHeart },
  { name: "Mart Sellers", href: "/dashboard/admin/mart/sellers", icon: Store },
  { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export function MobileDashboardNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname.includes("/admin");
  const [pendingAdsCount, setPendingAdsCount] = useState<number>(0);
  const supabase = createClient();
  const links = isAdmin ? adminLinks : editorLinks;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from("advertisements")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        if (!error && typeof count === "number") {
          setPendingAdsCount(count);
        }
      } catch (err) {
        console.error("Failed to fetch pending ads count (mobile):", err);
      }
    };

    fetchPendingCount();

    const channel = supabase
      .channel("admin-mobile-advertisements-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "advertisements" },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, supabase]);

  return (
    <div className={cn("bg-white border-b border-gray-100 shadow-sm", className)}>
      <div className="flex items-center space-x-1 overflow-x-auto px-4 py-3 scrollbar-none">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          const isAdsLink = link.name === "Ads";

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0",
                isActive 
                  ? "bg-upsa-navy text-white shadow-md" 
                  : "text-gray-500 hover:bg-upsa-navy/5 hover:text-upsa-navy"
              )}
            >
              <Icon className={cn("h-4 w-4 mr-2", isActive ? "text-upsa-gold" : "text-gray-400")} />
              <span>{link.name}</span>
              {isAdsLink && pendingAdsCount > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                  {pendingAdsCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
