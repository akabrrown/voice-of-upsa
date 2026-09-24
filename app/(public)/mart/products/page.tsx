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
  searchParams: { q?: string; category?: string };
}) {
  const query = searchParams?.q || '';
  const categoryId = searchParams?.category || '';
  
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
    <div className="min-h-[100dvh] bg-white">
      {/* Breadcrumb & Top Bar */}
      <div className="border-b border-border/40 bg-[#F9FAFB]">
        <div className="container flex h-14 items-center justify-between px-6 lg:px-16 xl:px-24 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="/mart" className="hover:text-upsa-navy transition-colors">Campus Mart</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-upsa-navy">All Products</span>
          </div>
          
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {products.length} {products.length === 1 ? 'Result' : 'Results'}
          </div>
        </div>
      </div>

      <div className="container px-6 lg:px-16 xl:px-24 max-w-[1600px] mx-auto py-10 flex flex-col md:flex-row gap-10">
        
        {/* Left Sidebar - Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-upsa-navy mb-8">
              {query ? `Search: ${query}` : categoryId ? categoryId : 'All Products'}
            </h1>
            
            <form action="/mart/products" method="GET" className="relative w-full mb-8">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                type="search" 
                name="q"
                placeholder="Search products..." 
                defaultValue={query}
                className="w-full rounded-none border border-border/60 bg-transparent pl-10 focus-visible:ring-0 focus-visible:border-upsa-navy shadow-none h-12"
              />
              {categoryId && <input type="hidden" name="category" value={categoryId} />}
            </form>
          </div>

          {/* Categories Filter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-upsa-navy mb-4 flex items-center justify-between">
              Categories
              <ChevronDown className="h-4 w-4" />
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/mart/products" 
                  className={`text-sm font-medium transition-colors hover:text-upsa-navy ${!categoryId ? 'text-upsa-navy font-bold' : 'text-gray-500'}`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={`/mart/products?category=${cat.id}`} 
                    className={`text-sm font-medium transition-colors hover:text-upsa-navy ${categoryId === cat.id ? 'text-upsa-navy font-bold' : 'text-gray-500'}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Condition Filter */}
          <div className="pt-6 border-t border-border/40">
            <h3 className="text-sm font-bold uppercase tracking-widest text-upsa-navy mb-4 flex items-center justify-between">
              Condition
              <ChevronDown className="h-4 w-4" />
            </h3>
            <ul className="space-y-3">
              {['New', 'Like New', 'Good', 'Fair'].map(cond => (
                <li key={cond} className="flex items-center gap-3 cursor-not-allowed opacity-50">
                  <div className="h-4 w-4 border border-border/60 rounded-none" />
                  <span className="text-sm font-medium text-gray-500">{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Content - Product Grid */}
        <main className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
            <Button variant="outline" className="md:hidden rounded-none border-border/60 font-bold uppercase tracking-widest text-xs h-10">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
            
            <div className="hidden md:flex items-center gap-4 text-sm">
              <span className="font-bold text-upsa-navy">Sort by:</span>
              <select className="bg-transparent font-medium text-gray-600 focus:outline-none cursor-pointer">
                <option>Newest Arrivals</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
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
              <div className="col-span-full flex min-h-[500px] flex-col items-center justify-center border border-dashed border-border/60 py-20 text-center">
                <Search className="h-10 w-10 text-gray-300 mb-4" />
                <h3 className="text-2xl font-extrabold text-upsa-navy">No products found</h3>
                <p className="mt-2 text-gray-500 max-w-sm text-balance">
                  We couldn't find any products matching your current filters. Try broadening your search.
                </p>
                <Button asChild className="mt-8 rounded-none bg-upsa-navy text-white hover:bg-upsa-navy/90 font-bold h-12 px-8">
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
