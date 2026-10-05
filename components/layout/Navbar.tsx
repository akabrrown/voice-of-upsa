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
import { User as UserIcon, LogOut, LayoutDashboard, Menu, Search, LogIn, BookOpen, GraduationCap, Calendar, Newspaper, MessageSquare, Trophy, Vote, Star, Home as HomeIcon, Layers, Megaphone, Info, PhoneCall, Bell, Store, Bot, EyeOff, Camera, Map, BarChart3, Video, BellRing, Mic, Briefcase, Users, Beaker, ChevronDown } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { InstallPWA } from "./InstallPWA";
import { NotificationBell } from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";

interface AuthenticatedUser extends User {
  role?: string;
}

const campusLifeFeatures = [
  { title: "Student Services", href: "/services", description: "Access official campus services and directories.", icon: Briefcase, completed: true },
  { title: "Student Handbook", href: "/handbook", description: "Official rules, regulations, and academic programs.", icon: BookOpen, completed: true },
  { title: "Campus Mart", href: "/mart", description: "Buy, sell, and trade within the campus community.", icon: Store, completed: false },
  { title: "Jobs Board", href: "/jobs", description: "Find internships, part-time jobs, and career opportunities.", icon: Users, completed: true },
  { title: "Campus Map", href: "/map", description: "Navigate the university with an interactive map.", icon: Map, completed: false },
];

const communityMediaFeatures = [
  { title: "Video TV", href: "/tv", description: "Watch campus news, shows, and event coverage.", icon: Video, completed: false },
  { title: "Podcasts", href: "/podcasts", description: "Listen to student voices and interviews.", icon: Mic, completed: false },
  { title: "Gallery", href: "/gallery", description: "Explore campus photos and event memories.", icon: Camera, completed: true },
  { title: "Anonymous", href: "/anonymous", description: "Share confessions and opinions safely.", icon: EyeOff, completed: false },
  { title: "Polls", href: "/polls", description: "Vote on pressing campus issues and debates.", icon: BarChart3, completed: true },
  { title: "AI Assistant", href: "/ai-assistant", description: "Your smart virtual campus guide.", icon: Bot, completed: false },
];

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
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = React.useState(false);
  const [mobileCampusLifeOpen, setMobileCampusLifeOpen] = React.useState(false);
  const [mobileCommunityOpen, setMobileCommunityOpen] = React.useState(false);
  const [showCategories, setShowCategories] = React.useState(false);
  const supabase = createClient();
  const router = useRouter();

  const isDev = process.env.NODE_ENV === "development";
  const visibleCampusLife = campusLifeFeatures.filter(f => isDev || f.completed);
  const visibleCommunity = communityMediaFeatures.filter(f => isDev || f.completed);

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

  // Close mobile menu on scroll (with threshold to prevent layout-shift blinking)
  React.useEffect(() => {
    if (!mobileMenuOpen) return;

    const initialScrollY = window.scrollY;

    const handleScroll = () => {
      if (Math.abs(window.scrollY - initialScrollY) > 10) {
        setMobileMenuOpen(false);
      }
    };
    
    // Add small delay to prevent immediate firing from layout shifts when opening
    const timeoutId = setTimeout(() => {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-upsa-navy text-white shadow-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center lg:space-x-3 group z-10">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-upsa-gold/20 transition-transform group-hover:scale-105 shadow-md shrink-0">
            <Image
              src="/logo.png"
              alt="Voice of UPSA"
              fill sizes="120px"
              className="object-cover"
              priority
            />
          </div>
          <div className="hidden lg:flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 justify-center">
            <span className="text-xs sm:text-xl font-black tracking-widest text-upsa-gold uppercase leading-none">Voice of</span>
            <span className="text-xl font-black tracking-tight text-white uppercase leading-tight">UPSA</span>
          </div>
        </Link>

        {/* Mobile Centered Text */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:hidden flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black tracking-[0.15em] text-upsa-gold uppercase leading-none mb-0.5">Voice of</span>
          <span className="text-lg font-black tracking-tight text-white uppercase leading-none">UPSA</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/">
                    <div className="flex items-center gap-1.5">
                      <HomeIcon className="h-4 w-4" />
                      Home
                    </div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>



              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy data-[state=open]:bg-upsa-gold data-[state=open]:text-upsa-navy transition-colors">
                  Categories
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-full p-4 md:p-6 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-b-2xl border-t-2 border-upsa-gold flex flex-col md:flex-row gap-6">
                    {/* Featured Panel */}
                    <div className="w-full md:w-[30%] shrink-0 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex flex-col justify-between border border-gray-200/60 relative overflow-hidden group/featured">
                      <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover/featured:scale-110 group-hover/featured:rotate-12 transition-all duration-700">
                        <Layers className="w-40 h-40 text-upsa-navy" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black text-upsa-navy mb-2 tracking-tight">Browse Topics</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">Explore articles across academics, campus events, sports, and student lifestyle.</p>
                      </div>
                      <div className="relative z-10 mt-8">
                        <Link href="/categories/all" className="inline-flex items-center text-sm font-bold text-upsa-gold group-hover/featured:translate-x-1 transition-transform">
                          View all articles <span className="ml-1 text-lg leading-none">&rarr;</span>
                        </Link>
                      </div>
                    </div>
                    {/* Grid */}
                    <ul className="w-full md:w-[70%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1">
                      {categories.map((category) => (
                        <ListItem
                          key={category.title}
                          title={category.title}
                          href={category.href}
                          icon={category.icon}
                        >
                          {category.description}
                        </ListItem>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy data-[state=open]:bg-upsa-gold data-[state=open]:text-upsa-navy transition-colors">
                  Campus Life
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-full p-4 md:p-6 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-b-2xl border-t-2 border-upsa-gold flex flex-col md:flex-row gap-6">
                    {/* Featured Panel */}
                    <div className="w-full md:w-[35%] shrink-0 rounded-2xl bg-gradient-to-br from-upsa-navy to-gray-900 p-6 flex flex-col justify-between border border-upsa-navy relative overflow-hidden group/featured">
                      <div className="absolute -bottom-4 -right-4 p-4 opacity-10 group-hover/featured:scale-110 transition-transform duration-700">
                        <Map className="w-40 h-40 text-white" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Campus Life</h3>
                        <p className="text-sm text-gray-300 leading-relaxed font-medium">Everything you need to thrive at UPSA. Discover services, campus map, jobs, and the marketplace.</p>
                      </div>
                      <div className="relative z-10 mt-8">
                        <Link href="/services" className="inline-flex items-center text-sm font-bold text-upsa-gold group-hover/featured:translate-x-1 transition-transform">
                          Explore services <span className="ml-1 text-lg leading-none">&rarr;</span>
                        </Link>
                      </div>
                    </div>
                    {/* Grid */}
                    <ul className="w-full md:w-[65%] grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                      {visibleCampusLife.map((feature) => (
                        <ListItem
                          key={feature.title}
                          title={feature.title}
                          href={feature.href}
                          icon={feature.icon}
                        >
                          {feature.description}
                        </ListItem>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {visibleCommunity.length > 0 && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy data-[state=open]:bg-upsa-gold data-[state=open]:text-upsa-navy transition-colors">
                    Community
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-full p-4 md:p-6 bg-white/95 backdrop-blur-3xl shadow-2xl rounded-b-2xl border-t-2 border-upsa-gold flex flex-col md:flex-row gap-6">
                      {/* Featured Panel */}
                      <div className="w-full md:w-[30%] shrink-0 rounded-2xl bg-gradient-to-br from-upsa-gold to-yellow-500 p-6 flex flex-col justify-between relative overflow-hidden group/featured shadow-inner">
                        <div className="absolute -top-4 -right-4 p-4 opacity-20 group-hover/featured:scale-110 group-hover/featured:-rotate-12 transition-all duration-700">
                          <Users className="w-40 h-40 text-upsa-navy" />
                        </div>
                        <div className="relative z-10">
                          <h3 className="text-2xl font-black text-upsa-navy mb-2 tracking-tight">Community</h3>
                          <p className="text-sm text-upsa-navy/80 leading-relaxed font-medium">Engage with fellow students. Participate in polls, watch campus TV, or drop an anonymous confession.</p>
                        </div>
                        <div className="relative z-10 mt-8">
                          <Link href="/tv" className="inline-flex items-center text-sm font-black text-upsa-navy group-hover/featured:translate-x-1 transition-transform bg-white/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                            Watch TV <span className="ml-1 text-lg leading-none">&rarr;</span>
                          </Link>
                        </div>
                      </div>
                      {/* Grid */}
                      <ul className="w-full md:w-[70%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-1">
                        {visibleCommunity.map((feature) => (
                          <ListItem
                            key={feature.title}
                            title={feature.title}
                            href={feature.href}
                            icon={feature.icon}
                          >
                            {feature.description}
                          </ListItem>
                        ))}
                      </ul>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/advertise">
                    <div className="flex items-center gap-1.5">
                      <Megaphone className="h-4 w-4" />
                      Advertise
                    </div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/about">
                    <div className="flex items-center gap-1.5">
                      <Info className="h-4 w-4" />
                      About
                    </div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), "bg-transparent text-white hover:bg-upsa-gold hover:text-upsa-navy transition-colors")}>
                  <Link href="/contact">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="h-4 w-4" />
                      Contact
                    </div>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-2 md:space-x-4">
          
          <div className="hidden sm:flex items-center space-x-2 border-l border-white/20 pl-4">
            <InstallPWA />
            {user ? (
              <>
                <NotificationBell user={user} />
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
              <button 
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                className="w-full flex items-center justify-between text-gray-400 py-2 hover:text-upsa-gold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileCategoriesOpen ? "rotate-180" : "")} />
              </button>
              {mobileCategoriesOpen && (
                <div className="grid grid-cols-2 gap-2 pt-1 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
              )}
            </div>

            <div className="space-y-1 pt-2 border-t border-white/10">
              <button 
                onClick={() => setMobileCampusLifeOpen(!mobileCampusLifeOpen)}
                className="w-full flex items-center justify-between text-gray-400 py-2 hover:text-upsa-gold transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Campus Life</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileCampusLifeOpen ? "rotate-180" : "")} />
              </button>
              {mobileCampusLifeOpen && (
                <div className="grid grid-cols-2 gap-2 pt-1 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {visibleCampusLife.map((feature) => (
                    <Link
                      key={feature.title}
                      href={feature.href}
                      className="text-gray-200 hover:text-upsa-gold text-sm py-1.5 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {visibleCommunity.length > 0 && (
              <div className="space-y-1 pt-2 border-t border-white/10">
                <button 
                  onClick={() => setMobileCommunityOpen(!mobileCommunityOpen)}
                  className="w-full flex items-center justify-between text-gray-400 py-2 hover:text-upsa-gold transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Community</span>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", mobileCommunityOpen ? "rotate-180" : "")} />
                </button>
                {mobileCommunityOpen && (
                  <div className="grid grid-cols-2 gap-2 pt-1 pl-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {visibleCommunity.map((feature) => (
                      <Link
                        key={feature.title}
                        href={feature.href}
                        className="text-gray-200 hover:text-upsa-gold text-sm py-1.5 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {feature.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
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
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {/* Show PWA Install button on mobile without the hidden class */}
            <div className="[&>button]:w-full [&>button]:justify-center [&>button]:flex sm:[&>button]:hidden">
              <InstallPWA />
            </div>
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

      {/* Secondary Search Bar Row (Under Nav Buttons) */}
      <div className="border-t border-white/10 bg-upsa-navy/95 py-2 px-4 shadow-inner flex justify-center backdrop-blur-md">
        <div className="container px-4 flex justify-center w-full max-w-3xl">
          <GlobalSearch className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 bg-black/20 hover:bg-black/30 rounded-full border border-white/10 transition-colors w-full focus-within:ring-2 focus-within:ring-upsa-gold/50 shadow-sm" />
        </div>
      </div>
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
            "group flex items-start select-none space-x-4 rounded-xl p-3 no-underline outline-none transition-all duration-200 hover:bg-gray-100/70 focus:bg-gray-100/70 active:scale-[0.98] bg-transparent w-full",
            className
          )}
          {...props}
        >
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-500 group-hover:bg-upsa-navy group-hover:text-upsa-gold group-hover:ring-upsa-navy transition-all duration-300">
              <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
          )}
          <div className="space-y-1 pt-0.5 w-full text-left">
            <div className="text-sm font-bold tracking-tight leading-none text-gray-900 group-hover:text-upsa-navy transition-colors">{title}</div>
            <p className="line-clamp-2 text-xs font-medium leading-relaxed text-gray-500 group-hover:text-gray-600 transition-colors">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
