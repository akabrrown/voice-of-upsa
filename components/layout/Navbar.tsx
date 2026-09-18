"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User as UserIcon, LogOut, LayoutDashboard, Menu, Search, LogIn, BookOpen, GraduationCap, Calendar, Newspaper, MessageSquare, Trophy, Vote, Star, Home as HomeIcon, Layers, Megaphone, Info, PhoneCall, Bell } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface AuthenticatedUser extends User {
  role?: string;
}

const categories = [
  { title: "All Articles", href: "/categories/all", description: "Browse all published articles.", icon: BookOpen },
  { title: "Academics", href: "/categories/academics", description: "Academic news, programmes, and research updates.", icon: GraduationCap },
  { title: "Events", href: "/categories/events", description: "Campus events, workshops, and seminars.", icon: Calendar },
  { title: "News", href: "/categories/news", description: "General UPSA and national news.", icon: Newspaper },
  { title: "Opinions", href: "/categories/opinions", description: "Op-eds and student voices.", icon: MessageSquare },
  { title: "Sports", href: "/categories/sports", description: "UPSA sports coverage.", icon: Trophy },
  { title: "Politics", href: "/categories/politics", description: "Student governance, SRC updates, and political campaigns.", icon: Vote },
  { title: "Featured", href: "/categories/featured", description: "Top-priority articles selected by editors.", icon: Star },
];

export function Navbar() {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null);
  const [unreadNotifications, setUnreadNotifications] = React.useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);
  const supabase = createClient();
  const router = useRouter();

  React.useEffect(() => {
    const fetchUserRole = async (user: User | null) => {
      if (!user) {
        setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setUser({ ...user, role: profile?.role || "public" } as AuthenticatedUser);
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      fetchUserRole(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Fetch and subscribe to notifications for authenticated user
  React.useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (!error && typeof count === "number") {
          setUnreadNotifications(count);
        }
      } catch (err) {
        console.error("Failed to load notifications count:", err);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`navbar-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-upsa-navy text-white shadow-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-upsa-gold/20 transition-transform group-hover:scale-105 shadow-md">
            <Image
              src="/logo.jpg"
              alt="Voice of UPSA"
              fill sizes="120px"
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
            <span className="text-xl font-black tracking-tight text-white uppercase leading-tight">UPSA</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/" className="flex items-center gap-1.5">
                    <HomeIcon className="h-4 w-4" />
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>



              <NavigationMenuItem>
                <button 
                  onClick={() => setShowCategories(!showCategories)}
                  className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors flex items-center gap-1.5 cursor-pointer", showCategories && "bg-upsa-gold text-upsa-navy")}
                >
                  <Layers className="h-4 w-4" />
                  Categories
                </button>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/advertise" className="flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4" />
                    Advertise
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/about" className="flex items-center gap-1.5">
                    <Info className="h-4 w-4" />
                    About
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/contact" className="flex items-center gap-1.5">
                    <PhoneCall className="h-4 w-4" />
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-4">

          
          <div className="hidden sm:flex items-center space-x-2 border-l border-white/20 pl-4">
            {user ? (
              <>
                <Button asChild variant="ghost" className="text-white hover:bg-upsa-gold hover:text-upsa-navy relative px-3">
                  <Link href="/profile?tab=notifications" title="View Notifications" className="flex items-center">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="text-white hover:bg-upsa-gold hover:text-upsa-navy">
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                {user.role !== "public" && (
                  <Button asChild variant="ghost" className="text-white hover:bg-upsa-gold hover:text-upsa-navy">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="ghost" 
                  className="text-white hover:bg-red-500 hover:text-white transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-upsa-gold rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer transition-colors">
                  <Link href="/auth/login" className="flex items-center">
                    <LogIn className="mr-1.5 h-3.5 w-3.5" />
                    Login
                  </Link>
                </Button>
                <Button asChild className="bg-upsa-gold text-upsa-navy hover:bg-white hover:text-upsa-navy transition-colors font-bold rounded-lg px-4 py-2 text-xs cursor-pointer">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-white hover:bg-upsa-gold"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Secondary Navigation for Categories (FT Style) */}
      {showCategories && (
        <div className="hidden lg:block w-full bg-gray-50 border-t border-gray-200 border-b shadow-sm overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-start md:justify-center space-x-6 md:space-x-8 h-11 min-w-max md:min-w-0 mx-auto">
              {categories.map((c) => (
                <Link 
                  key={c.href} 
                  href={c.href} 
                  className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-[0.1em] whitespace-nowrap hover:text-upsa-gold transition-colors py-2"
                >
                  <c.icon className="h-3.5 w-3.5" />
                  <span>{c.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay & Content */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-upsa-navy border-t border-white/10 px-4 py-6 space-y-4 animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col space-y-3">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white hover:text-upsa-gold py-2 font-bold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <HomeIcon className="h-5 w-5" />
              Home
            </Link>
            
            {/* Category Accordion / List */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400">
                <Layers className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 pl-2">
                {categories.map((category) => (
                  <Link
                    key={category.title}
                    href={category.href}
                    className="text-gray-200 hover:text-upsa-gold text-sm py-1.5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            </div>

            <Link 
              href="/advertise" 
              className="flex items-center gap-2 text-white hover:text-upsa-gold py-2 font-bold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Megaphone className="h-5 w-5" />
              Advertise
            </Link>
            <Link 
              href="/about" 
              className="flex items-center gap-2 text-white hover:text-upsa-gold py-2 font-bold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Info className="h-5 w-5" />
              About
            </Link>
            <Link 
              href="/contact" 
              className="flex items-center gap-2 text-white hover:text-upsa-gold py-2 font-bold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <PhoneCall className="h-5 w-5" />
              Contact
            </Link>
          </nav>

          {/* User Auth controls inside mobile menu */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
            {user ? (
              <>
                <Button asChild variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-upsa-gold hover:text-upsa-navy justify-between">
                  <Link href="/profile?tab=notifications" onClick={() => setMobileMenuOpen(false)}>
                    <span className="flex items-center">
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </span>
                    {unreadNotifications > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {unreadNotifications} new
                      </span>
                    )}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-upsa-gold hover:text-upsa-navy">
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                {user.role !== "public" && (
                  <Button asChild variant="outline" className="w-full bg-transparent text-white border-white/20 hover:bg-upsa-gold hover:text-upsa-navy">
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline" className="bg-transparent text-white border-white/20 hover:bg-upsa-gold hover:text-upsa-navy hover:border-transparent">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="bg-upsa-gold text-upsa-navy hover:bg-white hover:text-upsa-navy font-bold">
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    Register
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ElementType }
>(({ className, title, children, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          href={props.href ?? "#"}
          className={cn(
            "group flex items-start select-none space-x-4 rounded-xl p-3 leading-none no-underline outline-none transition-all hover:bg-gray-50 focus:bg-gray-50 active:scale-95",
            className
          )}
          {...props}
        >
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-upsa-gold/10 text-upsa-navy group-hover:bg-upsa-gold group-hover:text-white transition-colors shadow-sm">
              <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
            </div>
          )}
          <div className="space-y-1.5 pt-0.5">
            <div className="text-sm font-bold leading-none text-gray-900 group-hover:text-upsa-navy">{title}</div>
            <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
