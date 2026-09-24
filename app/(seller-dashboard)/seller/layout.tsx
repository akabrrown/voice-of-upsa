import Link from "next/link";
import { Store, Package, ShoppingCart, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full border-r border-border/40 bg-muted/20 md:w-64 md:flex-shrink-0">
        <div className="flex h-14 items-center border-b border-border/40 px-6">
          <Link href="/mart" className="flex items-center gap-2 font-bold text-indigo-500">
            <Store className="h-5 w-5" />
            <span>Seller Hub</span>
          </Link>
        </div>
        <nav className="flex flex-col gap-2 p-4">
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/seller">
              <BarChart3 className="h-4 w-4 text-muted-foreground" /> Overview
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/seller/products">
              <Package className="h-4 w-4 text-muted-foreground" /> Products
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/seller/orders">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" /> Orders
            </Link>
          </Button>
          <div className="my-4 border-t border-border/40" />
          <Button variant="ghost" className="justify-start gap-3" asChild>
            <Link href="/seller/settings">
              <Settings className="h-4 w-4 text-muted-foreground" /> Store Settings
            </Link>
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
