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
  LogOut,
  CalendarHeart,
  Shield,
  Store
} from "lucide-react";

const editorLinks = [
  { name: "Overview", href: "/dashboard/editor", icon: LayoutDashboard },
  { name: "My Articles", href: "/dashboard/editor/articles", icon: FileText },
  { name: "Create New", href: "/dashboard/editor/articles/new", icon: PlusCircle },
];

const adminLinks = [
  { name: "Admin Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
  { name: "All Articles", href: "/dashboard/admin/articles", icon: FileText },
  { name: "Editorial Team", href: "/dashboard/admin/team", icon: Users },
  { name: "User Management", href: "/dashboard/admin/users", icon: UserCheck },
  { name: "Role Management", href: "/dashboard/admin/roles", icon: Shield },
  { name: "Advertisements", href: "/dashboard/admin/ads", icon: Megaphone },
  { name: "Holiday Wishes", href: "/dashboard/admin/holidays", icon: CalendarHeart },
  { name: "Documents", href: "/dashboard/admin/documents", icon: FolderOpen },
  ...(process.env.NODE_ENV !== "production" ? [{ name: "Mart Sellers", href: "/dashboard/admin/mart/sellers", icon: Store }] : []),
  { name: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { name: "Site Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
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
        console.error("Failed to fetch pending ads count:", err);
      }
    };

    fetchPendingCount();

    // Live subscription for instant updates when users submit ads
    const channel = supabase
      .channel("admin-sidebar-advertisements-count")
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className={cn("w-64 border-r bg-white flex flex-col", className)}>
      <div className="p-6 flex-1">
        <Link href="/" className="flex items-center space-x-3 mb-6 px-1 group">
          <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-upsa-gold/30 shadow-sm shrink-0">
            <Image
              src="/logo.jpg"
              alt="Voice of UPSA"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
            <span className="text-base font-black tracking-tight text-upsa-navy uppercase leading-tight">UPSA</span>
          </div>
        </Link>

        <div className="mb-6 px-2">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            {isAdmin ? "Admin Portal" : "Editor Workspace"}
          </h2>
        </div>
        
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            const isAdsLink = link.name === "Advertisements";

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all",
                  isActive 
                    ? "bg-upsa-navy text-white shadow-lg" 
                    : "text-gray-500 hover:bg-upsa-navy/5 hover:text-upsa-navy"
                )}
              >
                <Icon className={cn("h-5 w-5 mr-3 shrink-0", isActive ? "text-upsa-gold" : "text-gray-400")} />
                <span className="truncate">{link.name}</span>
                {isAdsLink && pendingAdsCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
                    {pendingAdsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
