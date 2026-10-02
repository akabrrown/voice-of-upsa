"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  MessageSquare,
  Megaphone,
  FolderOpen,
  CalendarHeart,
  Shield,
  Store,
  Bookmark,
  History,
  User,
  LogOut,
  Vote,
  Camera,
} from "lucide-react";

type NavLink = { name: string; href: string; icon: any; badge?: "ads" | "inbox" };

const userLinks: NavLink[] = [
  { name: "My Profile", href: "/dashboard/user", icon: User },
  { name: "Saved Articles", href: "/dashboard/user/bookmarks", icon: Bookmark },
  { name: "Reading History", href: "/dashboard/user/history", icon: History },
];

const editorLinks: NavLink[] = [
  { name: "Overview", href: "/dashboard/editor", icon: LayoutDashboard },
  { name: "My Articles", href: "/dashboard/editor/articles", icon: FileText },
  { name: "Create New", href: "/dashboard/editor/articles/new", icon: PlusCircle },
];

type AdminGroup = { label: string; links: NavLink[] };

const adminGroups: AdminGroup[] = [
  {
    label: "Overview",
    links: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { name: "Site Settings", href: "/dashboard/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Content",
    links: [
      { name: "All Articles", href: "/dashboard/admin/articles", icon: FileText },
      { name: "Polls", href: "/dashboard/admin/polls", icon: Vote },
      { name: "Holiday Wishes", href: "/dashboard/admin/holidays", icon: CalendarHeart },
      { name: "Documents", href: "/dashboard/admin/documents", icon: FolderOpen },
    ],
  },
  {
    label: "Community",
    links: [
      { name: "Services Directory", href: "/dashboard/admin/services", icon: FolderOpen },
      { name: "Gallery", href: "/dashboard/admin/gallery", icon: Camera },
      ...(process.env.NODE_ENV !== "production"
        ? [{ name: "Mart Sellers", href: "/dashboard/admin/mart/sellers", icon: Store }]
        : []),
    ],
  },
  {
    label: "Monetization",
    links: [
      { name: "Advertisements", href: "/dashboard/admin/ads", icon: Megaphone, badge: "ads" as const },
      { name: "Inbox", href: "/dashboard/admin/inbox", icon: MessageSquare, badge: "inbox" as const },
    ],
  },
  {
    label: "Team & Access",
    links: [
      { name: "Editorial Team", href: "/dashboard/admin/team", icon: Users },
      { name: "User Management", href: "/dashboard/admin/users", icon: UserCheck },
      { name: "Role Management", href: "/dashboard/admin/roles", icon: Shield },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
        console.error("Failed to fetch pending ads count:", err);
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
        console.error("Failed to fetch unread messages count:", err);
      }
    };

    fetchPendingCount();
    fetchUnreadMessagesCount();

    const channel = supabase
      .channel("admin-sidebar-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "advertisements" }, fetchPendingCount)
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, fetchUnreadMessagesCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

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
          "flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all",
          isActive
            ? "bg-upsa-navy text-white shadow-md"
            : "text-gray-500 hover:bg-upsa-navy/5 hover:text-upsa-navy"
        )}
      >
        <Icon className={cn("h-4 w-4 mr-3 shrink-0", isActive ? "text-upsa-gold" : "text-gray-400")} />
        <span className="truncate">{link.name}</span>
        {badgeCount > 0 && (
          <span className={cn(
            "ml-auto text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 animate-pulse",
            link.badge === "ads" ? "bg-amber-500" : "bg-red-500"
          )}>
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className={cn("w-64 border-r bg-white flex flex-col", className)}>
      <div className="p-5 flex-1 overflow-y-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 mb-6 px-1 group">
          <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-upsa-gold/30 shadow-sm shrink-0">
            <Image src="/logo.png" alt="Voice of UPSA" fill sizes="36px" className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
            <span className="text-sm font-black tracking-tight text-upsa-navy uppercase">UPSA</span>
          </div>
        </Link>

        {/* Section label */}
        <div className="mb-4 px-1">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {isAdmin ? "Admin Portal" : isUser ? "My Account" : "Editor Workspace"}
          </h2>
        </div>

        {/* Admin grouped nav */}
        {isAdmin ? (
          <div className="space-y-5">
            {adminGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.links.map(renderLink)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <nav className="space-y-0.5">
            {plainLinks.map(renderLink)}
          </nav>
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
