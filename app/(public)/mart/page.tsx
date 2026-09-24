import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/mart/product-card";
import { Product } from "@/lib/marketplace/types";

// Force dynamic since marketplace products update frequently
export const dynamic = 'force-dynamic';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/mart/products`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Failed to fetch products for mart home:", error);
    return [];
  }
}

export default async function CampusMartHomePage() {
  const products = await getFeaturedProducts();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F9FAFB]">
      {/* Featured Products */}
      <section className="px-6 py-12 lg:px-16 xl:px-24 max-w-[1600px] mx-auto w-full">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-8">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-upsa-navy">Fresh on Campus</h2>
            <p className="text-lg text-gray-600 mt-4">Latest items listed by fellow students</p>
          </div>
          <Button variant="ghost" className="hidden sm:flex group rounded-none font-bold text-upsa-navy hover:bg-upsa-navy/5" asChild>
            <Link href="/mart/products">
              View all products <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.length > 0 ? (
            products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-32 text-center border border-dashed border-border">
              <p className="text-xl font-medium text-muted-foreground mb-4">No products found.</p>
              <Button className="rounded-none bg-upsa-gold text-upsa-navy hover:bg-upsa-gold/90" asChild>
                <Link href="/mart/sell">Be the first to list an item</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center sm:hidden">
          <Button variant="outline" className="w-full rounded-none border-2 border-upsa-navy text-upsa-navy font-bold h-14" asChild>
            <Link href="/mart/products">View all products</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
