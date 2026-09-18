"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Filter, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArticleGridShadowLoader } from "@/components/ui/shadow-loaders";
import { Pagination } from "@/components/ui/pagination";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState("Anytime");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();
  const limit = 12;

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, selectedCategories, dateRange]);

  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        let queryBuilder = supabase
          .from("articles")
          .select("*, categories(name)", { count: "exact" })
          .eq("status", "published")
          .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`);

        if (selectedCategories.length > 0) {
          const { data: cats } = await supabase
            .from("categories")
            .select("id")
            .in("name", selectedCategories);
          if (cats && cats.length > 0) {
            queryBuilder = queryBuilder.in("category_id", cats.map(c => c.id));
          }
        }

        if (dateRange !== "Anytime") {
          const now = new Date();
          let filterDate = new Date();
          if (dateRange === "Last 24 hours") {
            filterDate.setDate(now.getDate() - 1);
          } else if (dateRange === "Last week") {
            filterDate.setDate(now.getDate() - 7);
          } else if (dateRange === "Last month") {
            filterDate.setMonth(now.getMonth() - 1);
          } else if (dateRange === "Last year") {
            filterDate.setFullYear(now.getFullYear() - 1);
          }
          queryBuilder = queryBuilder.gte("published_at", filterDate.toISOString());
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await queryBuilder
          .order("published_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        if (data) {
          setTotalCount(count || 0);
          setTotalPages(Math.ceil((count || 0) / limit));
          const mapped = data.map((art: any) => ({
            title: art.title,
            excerpt: art.excerpt || "",
            category: art.categories?.name || "News",
            date: art.published_at ? new Date(art.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            }) : "Recent",
            readTime: art.reading_time_minutes ? `${art.reading_time_minutes} min read` : "3 min read",
            image: art.cover_image_url || "/campus.png",
            slug: art.slug,
          }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error("Error searching articles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selectedCategories, dateRange, page, supabase]);

  const handleCategoryChange = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="bg-gray-50 border-b">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-black text-upsa-navy mb-8 tracking-tight uppercase">Search Voice of UPSA</h1>
            <div className="max-w-2xl mx-auto relative">
              <Input 
                className="h-16 pl-14 pr-32 text-lg rounded-2xl border-none shadow-xl focus-visible:ring-upsa-navy/20"
                placeholder="Search for articles, events, news..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300" />
              {isLoading && (
                <div className="absolute right-36 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-upsa-navy"></div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Filters Sidebar */}
            <div className="w-full lg:w-64 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-upsa-navy mb-4">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-bold uppercase tracking-widest text-xs">Filter By</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date Range</p>
                  <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-lg p-2 text-sm font-medium"
                  >
                    <option>Anytime</option>
                    <option>Last 24 hours</option>
                    <option>Last week</option>
                    <option>Last month</option>
                    <option>Last year</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</p>
                  <div className="space-y-1">
                    {["Academics", "Events", "News", "Opinions", "Sports"].map((cat) => (
                      <label key={cat} className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy" 
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCategoryChange(cat)}
                        />
                        <span className="text-sm text-gray-600 group-hover:text-upsa-navy transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 space-y-8">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-upsa-navy">
                  {query ? `Results for "${query}"` : "Search Results"}
                </h2>
                <div className="flex items-center space-x-2 text-xs text-gray-400 font-bold">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>{totalCount} results found</span>
                </div>
              </div>

              {isLoading ? (
                <ArticleGridShadowLoader count={4} />
              ) : searchResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {searchResults.map((res) => (
                      <ArticleCard key={res.slug} {...res} />
                    ))}
                  </div>
                  <Pagination 
                    currentPage={page} 
                    totalPages={totalPages} 
                    onPageChange={(p) => setPage(p)} 
                  />
                </>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-gray-400 italic">
                    {query ? "No results found for your search." : "Type above to search articles..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
