"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Image as ImageIcon, ShoppingBag, Newspaper, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchResult = {
  id: string;
  type: 'article' | 'document' | 'album' | 'market';
  title: string;
  description: string;
  url: string;
  date: string;
};

export default function GlobalSearch({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K to focus
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Debounced search function
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) {
          setResults(json.data || []);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'article': return <Newspaper className="h-5 w-5 text-blue-500" />;
      case 'document': return <FileText className="h-5 w-5 text-emerald-500" />;
      case 'album': return <ImageIcon className="h-5 w-5 text-purple-500" />;
      case 'market': return <ShoppingBag className="h-5 w-5 text-orange-500" />;
      default: return <Search className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleSelect = (url: string) => {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(url);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Inline Search Input */}
      <div className={className || "flex items-center gap-3 px-4 py-2 text-sm text-gray-300 bg-white/10 hover:bg-white/15 rounded-full border border-white/10 transition-colors w-full focus-within:ring-2 focus-within:ring-upsa-gold/50 shadow-sm"}>
        <Search className="h-5 w-5 shrink-0 opacity-70" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder="Search news, documents, gallery, or campus mart..."
          className="flex-1 bg-transparent border-0 outline-none text-white placeholder:text-gray-300/70"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }} 
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-gray-300">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-200">
          {/* Header Row when searching */}
          {isSearching && (
            <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin mr-2 shrink-0" />
              <span className="text-sm text-gray-500 font-medium">Searching across platform...</span>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {query.trim() === "" ? (
              <div className="p-8 text-center text-gray-500">
                <p className="font-medium text-gray-900 mb-2">Search Voice of UPSA</p>
                <p className="text-sm">Start typing to search across the entire platform.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">News</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">Documents</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">Gallery</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">Mart</span>
                </div>
              </div>
            ) : results.length === 0 && !isSearching ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">No results found.</p>
                <p className="text-sm">We couldn't find anything matching "{query}".</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result.url)}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-100/80 transition-colors text-left group"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow border border-gray-100 transition-all shrink-0">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {result.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {result.description}
                      </p>
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded shrink-0">
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-50/80 border-t border-gray-100 p-3 text-xs text-gray-500 flex justify-between items-center">
            <span>Results from 4 campus sources</span>
          </div>
        </div>
      )}
    </div>
  );
}
