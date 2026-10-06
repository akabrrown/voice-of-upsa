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
  FolderOpen,
  Shield,
  Bookmark,
  History,
  User,
  MessageSquare,
  UserCheck,
  Vote,
  Camera,
} from "lucide-react";

type NavLink = { name: string; href: string; icon: any; badge?: "ads" | "inbox" };
type AdminGroup = { label: string; links: NavLink[] };

const userLinks: NavLink[] = [
  { name: "Profile", href: "/dashboard/user", icon: User },
  { name: "Saved", href: "/dashboard/user/bookmarks", icon: Bookmark },
  { name: "History", href: "/dashboard/user/history", icon: History },
];

const editorLinks: NavLink[] = [
  { name: "Overview", href: "/dashboard/editor", icon: LayoutDashboard },
  { name: "My Articles", href: "/dashboard/editor/articles", icon: FileText },
  { name: "Create New", href: "/dashboard/editor/articles/new", icon: PlusCircle },
];

const adminGroups: AdminGroup[] = [
  {
    label: "Overview",
    links: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { name: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Content",
    links: [
      { name: "Articles", href: "/dashboard/admin/articles", icon: FileText },
      { name: "Polls", href: "/dashboard/admin/polls", icon: Vote },
      { name: "Holidays", href: "/dashboard/admin/holidays", icon: CalendarHeart },
      { name: "Documents", href: "/dashboard/admin/documents", icon: FolderOpen },
    ],
  },
  {
    label: "Community",
    links: [
      { name: "Services", href: "/dashboard/admin/services", icon: FolderOpen },
      { name: "Gallery", href: "/dashboard/admin/gallery", icon: Camera },
      ...(process.env.NODE_ENV !== "production"
        ? [{ name: "Mart", href: "/dashboard/admin/mart/sellers", icon: Store }]
        : []),
    ],
  },
  {
    label: "Monetization",
    links: [
      { name: "Ads", href: "/dashboard/admin/ads", icon: Megaphone, badge: "ads" as const },
      { name: "Inbox", href: "/dashboard/admin/inbox", icon: MessageSquare, badge: "inbox" as const },
    ],
  },
  {
    label: "Team",
    links: [
      { name: "Editorial Team", href: "/dashboard/admin/team", icon: Users },
      { name: "Users", href: "/dashboard/admin/users", icon: UserCheck },
      { name: "Roles", href: "/dashboard/admin/roles", icon: Shield },
    ],
  },
];

export function MobileDashboardNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname.includes("/admin");
  const isUser = pathname.includes("/user");
  const [pendingAdsCount, setPendingAdsCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const supabase = createClient();

  const plainLinks = isUser ? userLinks : editorLinks;

  useEffect(() => {
    if (!isAdmin) return;

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from("advertisements")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        if (!error && typeof count === "number") setPendingAdsCount(count);
      } catch (err) {
        console.error("Failed to fetch pending ads count (mobile):", err);
      }
    };

    const fetchUnreadMessagesCount = async () => {
      try {
        const { count, error } = await supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true })
          .eq("status", "unread");
        if (!error && typeof count === "number") setUnreadMessagesCount(count);
      } catch (err) {
        console.error("Failed to fetch unread messages count (mobile):", err);
      }
    };

    fetchPendingCount();
    fetchUnreadMessagesCount();

    const channel = supabase
      .channel(`admin-mobile-counts-${Math.random()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "advertisements" }, fetchPendingCount)
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, fetchUnreadMessagesCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, supabase]);

  const getBadgeCount = (badge?: "ads" | "inbox") => {
    if (badge === "ads") return pendingAdsCount;
    if (badge === "inbox") return unreadMessagesCount;
    return 0;
  };

  const renderLink = (link: NavLink) => {
    const Icon = link.icon;
    const isActive = pathname === link.href || (link.href !== "/dashboard/admin" && pathname.startsWith(link.href));
    const badgeCount = getBadgeCount(link.badge);

    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex-shrink-0",
          isActive
            ? "bg-upsa-navy text-white shadow-md"
            : "text-gray-500 hover:bg-upsa-navy/5 hover:text-upsa-navy"
        )}
      >
        <Icon className={cn("h-3.5 w-3.5 mr-1.5", isActive ? "text-upsa-gold" : "text-gray-400")} />
        <span>{link.name}</span>
        {badgeCount > 0 && (
          <span className={cn(
            "ml-1.5 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full",
            link.badge === "ads" ? "bg-amber-500" : "bg-red-500"
          )}>
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className={cn("bg-white border-b border-gray-100 shadow-sm", className)}>
      {isAdmin ? (
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex items-start gap-4 px-4 py-2 w-max">
            {adminGroups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 px-1">
                  {group.label}
                </span>
                <div className="flex items-center gap-1">
                  {group.links.map(renderLink)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-1 overflow-x-auto px-4 py-3 scrollbar-none">
          {plainLinks.map(renderLink)}
        </div>
      )}
    </div>
  );
}
