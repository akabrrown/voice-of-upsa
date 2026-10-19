import { Suspense } from "react";
import Link from "next/link";
import { Search, ChevronDown, Filter, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/mart/product-card";
import { Product } from "@/lib/marketplace/types";

export const dynamic = 'force-dynamic';

async function getProducts(searchQuery?: string, categoryId?: string): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (categoryId) params.append('category', categoryId);

    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/mart/products?${params.toString()}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    return [];
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q || '';
  const categoryId = resolvedSearchParams?.category || '';
  
  const products = await getProducts(query, categoryId);

  // Mock categories for the sidebar (in a real app, fetch these from DB)
  const categories = [
    { id: 'textbooks', name: 'Textbooks' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'clothing', name: 'Clothing & Fashion' },
    { id: 'services', name: 'Services' },
    { id: 'housing', name: 'Housing & Hostels' },
  ];

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-[#060D1A] transition-colors duration-300">
      {/* Breadcrumb & Top Bar */}
      <div className="border-b border-border/40 dark:border-white/10 bg-[#F9FAFB] dark:bg-[#0C1729]">
        <div className="container flex h-14 items-center justify-between px-6 lg:px-16 xl:px-24 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-400">
            <Link href="/mart" className="hover:text-upsa-navy dark:hover:text-upsa-gold transition-colors">Campus Mart</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-upsa-navy dark:text-white">All Products</span>
          </div>
          
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground dark:text-gray-400">
            {products.length} {products.length === 1 ? 'Result' : 'Results'}
          </div>
        </div>
      </div>

      <div className="container px-6 lg:px-16 xl:px-24 max-w-[1600px] mx-auto py-10 flex flex-col md:flex-row gap-10">
        
        {/* Left Sidebar - Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-upsa-navy dark:text-white mb-8">
              {query ? `Search: ${query}` : categoryId ? categoryId : 'All Products'}
            </h1>
            
            <form action="/mart/products" method="GET" className="relative w-full mb-8">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-gray-400" />
              <Input 
                type="search" 
                name="q"
                placeholder="Search products..." 
                defaultValue={query}
                className="w-full rounded-none border border-border/60 dark:border-white/10 bg-white dark:bg-[#0C1729] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 pl-10 focus-visible:ring-0 focus-visible:border-upsa-navy dark:focus-visible:border-upsa-gold shadow-none h-12"
              />
              {categoryId && <input type="hidden" name="category" value={categoryId} />}
            </form>
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-upsa-navy dark:text-white mb-4 flex items-center justify-between">
              Categories
              <ChevronDown className="h-4 w-4" />
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/mart/products" 
                  className={`text-sm font-medium transition-colors hover:text-upsa-navy dark:hover:text-upsa-gold ${!categoryId ? 'text-upsa-navy dark:text-upsa-gold font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={`/mart/products?category=${cat.id}`} 
                    className={`text-sm font-medium transition-colors hover:text-upsa-navy dark:hover:text-upsa-gold ${categoryId === cat.id ? 'text-upsa-navy dark:text-upsa-gold font-bold' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Condition Filter */}
          <div className="pt-6 border-t border-border/40 dark:border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-upsa-navy dark:text-white mb-4 flex items-center justify-between">
              Condition
              <ChevronDown className="h-4 w-4" />
            </h3>
            <ul className="space-y-3">
              {['New', 'Like New', 'Good', 'Fair'].map(cond => (
                <li key={cond} className="flex items-center gap-3 cursor-not-allowed opacity-50">
                  <div className="h-4 w-4 border border-border/60 dark:border-white/20 rounded-none" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Content - Product Grid */}
        <main className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40 dark:border-white/10">
            <Button variant="outline" className="md:hidden rounded-none border-border/60 dark:border-white/10 text-upsa-navy dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 font-bold uppercase tracking-widest text-xs h-10">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
            
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="font-bold text-upsa-navy dark:text-white">Sort by:</span>
              <select className="bg-transparent font-medium text-gray-600 dark:text-gray-300 dark:bg-[#0C1729] focus:outline-none cursor-pointer">
                <option className="dark:bg-[#0C1729] dark:text-white">Newest Arrivals</option>
                <option className="dark:bg-[#0C1729] dark:text-white">Price: Low to High</option>
                <option className="dark:bg-[#0C1729] dark:text-white">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full flex min-h-[500px] flex-col items-center justify-center border border-dashed border-border/60 dark:border-white/10 rounded-xl bg-white dark:bg-[#0C1729] py-20 text-center">
                <Search className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-2xl font-extrabold text-upsa-navy dark:text-white">No products found</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-sm text-balance">
                  We couldn't find any products matching your current filters. Try broadening your search.
                </p>
                <Button asChild className="mt-8 rounded-none bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy hover:bg-upsa-navy/90 dark:hover:bg-white font-bold h-12 px-8">
                  <Link href="/mart/products">Clear Filters</Link>
                </Button>
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
