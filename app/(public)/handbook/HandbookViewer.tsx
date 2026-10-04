"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronRight, ChevronLeft, Menu, X, BookText, Share2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageData {
  pageNumber: number;
  blocks?: string[];
  content?: string; // Fallback
}

interface HandbookViewerProps {
  pages: PageData[];
}

const tableOfContents = [
  { title: "Table of Contents", page: 4 },
  { title: "Chapter 1: General Information", page: 14 },
  { title: "Chapter 2: Academic Programmes", page: 39 },
  { title: "Chapter 3: Resources & Facilities", page: 250 },
  { title: "Chapter 4: Examinations", page: 256 },
  { title: "Chapter 5: Students' Affairs", page: 273 },
  { title: "Appendices", page: 281 },
];

export default function HandbookViewer({ pages }: HandbookViewerProps) {
  const [currentPage, setCurrentPage] = useState<number>(14);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    // Generate a shareable URL that includes the current page if we had query params
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "UPSA Student Handbook",
          text: `Read the official UPSA Undergraduate Students' Handbook.`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled or failed.", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Filter pages that match the search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const lowerQuery = searchQuery.toLowerCase();
    return pages.filter(p => {
      const text = p.blocks ? p.blocks.join(" ") : p.content || "";
      return text.toLowerCase().includes(lowerQuery);
    });
  }, [searchQuery, pages]);

  const activePage = pages.find(p => p.pageNumber === currentPage) || pages[0];

  // Scroll to top when page changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handlePageChange = (pageNo: number) => {
    if (pageNo >= 1 && pageNo <= pages.length) {
      setCurrentPage(pageNo);
      setIsSidebarOpen(false);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200/60 text-zinc-900 rounded-[2px] px-0.5">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Premium renderer
  const renderBlock = (block: string, idx: number) => {
    // 1. Aggressively clean up text spaces
    let text = block.replace(/\s+/g, ' ').trim();
    
    // 2. Fix PDF encoding artifacts (Professional Text Editor Rule)
    text = text.replace(/\?T/g, "'")
               .replace(/\?"/g, '"')
               .replace(/\?/g, "'");
    
    if (!text) return null;
    
    // 3. Ignore stray page numbers, broken TOC number blobs, or roman numerals
    if (text.length <= 3 && (text.match(/^[ivxlc]+$/i) || text.match(/^\d+$/) || text.length === 1)) {
      return null;
    }
    // Ignore blocks that are entirely just numbers and spaces (like the broken TOC pages)
    if (text.match(/^[\d\s]+$/)) {
      return null;
    }

    const isAllUpperCase = text === text.toUpperCase() && text.match(/[A-Z]/);
    const isChapter = text.toLowerCase().startsWith("chapter");
    const isSection = text.match(/^\d+\.\d+(\.\d+)?\s+[A-Z]/);
    const isListItem = text.match(/^(\d+\.|[a-z]\.|•|-|\*)\s/);

    if (isChapter) {
      return (
        <div key={idx} className="mt-20 mb-10">
          <span className="block w-12 h-1.5 bg-upsa-gold mb-6 rounded-full" />
          <h1 className="text-4xl md:text-5xl font-black font-sans text-upsa-navy tracking-tight leading-tight">
            {searchQuery ? highlightText(text, searchQuery) : text}
          </h1>
        </div>
      );
    }

    if (isSection) {
      return (
        <h2 key={idx} className="text-2xl md:text-[26px] font-bold font-sans text-zinc-900 mt-14 mb-6 tracking-tight leading-snug">
          {searchQuery ? highlightText(text, searchQuery) : text}
        </h2>
      );
    }

    // Treat short all-uppercase lines as subheadings
    if (isAllUpperCase && text.length < 100) {
      return (
        <h3 key={idx} className="text-lg md:text-[19px] font-bold font-sans text-upsa-navy mt-10 mb-4 tracking-wider uppercase">
          {searchQuery ? highlightText(text, searchQuery) : text}
        </h3>
      );
    }

    if (isListItem) {
      return (
        <div key={idx} className="flex gap-4 my-5 pl-2 md:pl-6">
          <div className="w-2 h-2 rounded-full bg-upsa-gold mt-2.5 flex-shrink-0" />
          <p className="text-[16px] md:text-[17px] leading-[1.8] text-zinc-700 font-sans">
            {searchQuery ? highlightText(text.replace(/^(\d+\.|[a-z]\.|•|-|\*)\s/, ''), searchQuery) : text.replace(/^(\d+\.|[a-z]\.|•|-|\*)\s/, '')}
          </p>
        </div>
      );
    }

    // Standard paragraph with beautiful Sans-Serif legibility
    return (
      <p key={idx} className="mb-8 text-[16px] md:text-[17px] leading-[1.85] text-zinc-700 font-sans text-left break-words">
        {searchQuery ? highlightText(text, searchQuery) : text}
      </p>
    );
  };

  return (
    <div className="flex flex-col md:flex-row bg-white border border-zinc-200 rounded-lg overflow-hidden min-h-[85vh] max-w-7xl mx-auto shadow-sm">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="text-zinc-600">
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-zinc-900 font-sans tracking-tight">Handbook</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare} className="text-upsa-navy" aria-label="Share Handbook">
            {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
          </Button>
          <span className="text-xs font-medium text-zinc-500 bg-white border border-zinc-200 px-2.5 py-1 rounded-md">
            {currentPage}/{pages.length}
          </span>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        absolute inset-y-0 left-0 z-40 w-[280px] bg-zinc-50/50 border-r border-zinc-200 flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:transform-none md:w-[300px] lg:w-[320px] 
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest flex items-center gap-2">
            <BookText className="w-4 h-4 text-upsa-navy" />
            Contents
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare} className="hidden md:flex text-zinc-500 hover:text-upsa-navy hover:bg-upsa-navy/10" title="Share Handbook">
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-zinc-900" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              placeholder="Search handbook..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm bg-white border-zinc-200 focus-visible:ring-1 focus-visible:ring-upsa-navy rounded-md shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-3 pb-6 custom-scrollbar">
          {searchResults ? (
            <div className="px-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3 px-2">
                Matches ({searchResults.length})
              </p>
              {searchResults.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <p className="text-sm text-zinc-500">No results found.</p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {searchResults.map(res => (
                    <li key={res.pageNumber}>
                      <button
                        onClick={() => handlePageChange(res.pageNumber)}
                        className={`w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors ${
                          currentPage === res.pageNumber 
                            ? 'bg-zinc-200/50 text-zinc-900 font-medium' 
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                      >
                        Result on Page {res.pageNumber}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="px-2">
              <ul className="space-y-1">
                {tableOfContents.map((item, idx) => {
                  const isActive = currentPage >= item.page && (idx === tableOfContents.length - 1 || currentPage < tableOfContents[idx + 1].page);
                  return (
                    <li key={idx}>
                      <button
                        onClick={() => handlePageChange(item.page)}
                        className={`w-full flex justify-between items-center px-3 py-2.5 rounded-md text-[13.5px] transition-all duration-200 border border-transparent ${
                          isActive
                            ? 'bg-white shadow-sm border-zinc-200 text-upsa-navy font-semibold' 
                            : 'text-zinc-600 hover:bg-zinc-200/40'
                        }`}
                      >
                        <span>{item.title}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isActive ? 'bg-zinc-100 text-zinc-500' : 'text-zinc-400'}`}>{item.page}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-zinc-200/80 px-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                  Jump to Page
                </p>
                <Input 
                  type="number" 
                  min={1} 
                  max={pages.length} 
                  placeholder={`Page (1-${pages.length})`}
                  className="bg-white border-zinc-200 h-9 text-sm rounded-md shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(e.currentTarget.value);
                      if (!isNaN(val)) handlePageChange(val);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col bg-white relative">
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 lg:py-16 lg:px-24" ref={contentRef}>
          <div className="max-w-[65ch] mx-auto">
            <div className="pb-16">
              {activePage.blocks ? (
                activePage.blocks.map((block, idx) => renderBlock(block, idx))
              ) : activePage.content ? (
                <div className="prose prose-zinc prose-lg max-w-none font-serif text-zinc-700 leading-relaxed">
                  {activePage.content.split('\n').map((line, idx) => (
                    <p key={idx} className="mb-4">{searchQuery ? highlightText(line, searchQuery) : line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 italic">No content available for this page.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-zinc-100 bg-white p-4 px-6 md:px-12 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          >
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            Previous
          </Button>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-zinc-500">
              {currentPage} / {pages.length}
            </span>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pages.length}
            className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-zinc-900/20 backdrop-blur-[2px] z-30 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
