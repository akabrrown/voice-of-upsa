import type { Metadata } from "next";
import Link from "next/link";
import { Store, ShoppingBag, Search, User, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Campus Mart | UPSA Student Marketplace",
  description: "Buy and sell textbooks, electronics, dorm essentials, fashion, and campus services securely within the UPSA student community.",
  alternates: {
    canonical: "/mart",
  },
  openGraph: {
    title: "Campus Mart | UPSA Student Marketplace",
    description: "Buy and sell textbooks, electronics, dorm essentials, fashion, and campus services securely within the UPSA student community.",
    url: "/mart",
    type: "website",
  },
};

export default function MartLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Premium Mart Sub-navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 dark:border-white/10 bg-white dark:bg-[#060D1A] transition-colors duration-200">
        <div className="container flex h-16 items-center justify-between px-6 lg:px-12 max-w-[1400px] mx-auto">
          {/* Brand Logo */}
          <Link href="/mart" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-upsa-navy dark:bg-upsa-gold flex items-center justify-center">
              <Store className="h-4 w-4 text-upsa-gold dark:text-upsa-navy" />
            </div>
            <span className="font-extrabold text-upsa-navy dark:text-white tracking-widest uppercase text-sm sm:text-base group-hover:text-upsa-navy/80 dark:group-hover:text-upsa-gold transition-colors">
              Campus Mart
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center gap-6 sm:gap-10">
            <Link 
              href="/mart/products" 
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-colors hover:text-upsa-navy dark:hover:text-upsa-gold group"
            >
              <Search className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline-block">Shop All</span>
            </Link>
            
            <Link 
              href="/mart/cart" 
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 transition-colors hover:text-upsa-navy dark:hover:text-upsa-gold group relative"
            >
              <ShoppingBag className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline-block">Bag</span>
              {/* Optional: notification dot could go here later */}
            </Link>

            {/* Call to Action Button */}
            <Link 
              href="/mart/sell" 
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-upsa-navy dark:text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              <span className="hidden sm:inline-block">Start Selling</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-[#F9FAFB] dark:bg-[#060D1A] transition-colors duration-200">
        {children}
      </main>
    </div>
  );
}
