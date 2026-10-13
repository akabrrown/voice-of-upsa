import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseHref?: string; // Used for Server components, e.g. /categories/all?page=
  onPageChange?: (page: number) => void; // Used for Client components
}

export function Pagination({ currentPage, totalPages, baseHref, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPageLink = (pageNum: number, content: React.ReactNode, className?: string, disabled?: boolean) => {
    const baseClass = cn(
      "inline-flex items-center justify-center px-4 py-2 text-sm font-bold border transition-colors",
      pageNum === currentPage
        ? "bg-upsa-navy text-white border-upsa-navy"
        : "bg-white text-slate-800 border-gray-200 hover:bg-gray-50 hover:text-upsa-navy",
      disabled && "opacity-50 pointer-events-none",
      className
    );

    if (disabled) {
      return <span className={baseClass}>{content}</span>;
    }

    if (baseHref) {
      // Parse baseHref to correctly append page parameter whether it has existing query params or not
      const href = baseHref.includes("?") 
        ? `${baseHref}&page=${pageNum}` 
        : `${baseHref}?page=${pageNum}`;
        
      return (
        <Link href={href} className={baseClass}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={() => onPageChange?.(pageNum)} className={baseClass}>
        {content}
      </button>
    );
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  // Simple pagination logic: show first, last, and pages around current
  const visiblePages = pages.filter(p => 
    p === 1 || 
    p === totalPages || 
    Math.abs(currentPage - p) <= 1
  );

  return (
    <div className="flex items-center justify-center space-x-2 mt-12 mb-8">
      {renderPageLink(
        currentPage - 1,
        <><ChevronLeft className="h-4 w-4 mr-1" /> Previous</>,
        "rounded-l-lg",
        currentPage === 1
      )}
      
      <div className="hidden sm:flex items-center space-x-1 mx-2">
        {visiblePages.map((p, index) => {
          // Add ellipses if there's a gap
          const prev = index > 0 ? visiblePages[index - 1] : p - 1;
          return (
            <React.Fragment key={p}>
              {p - prev > 1 && <span className="px-2 text-gray-400">...</span>}
              {renderPageLink(p, p, "rounded-md px-3.5")}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile view simple page indicator */}
      <span className="sm:hidden text-sm font-bold text-gray-500 mx-4">
        Page {currentPage} of {totalPages}
      </span>

      {renderPageLink(
        currentPage + 1,
        <>Next <ChevronRight className="h-4 w-4 ml-1" /></>,
        "rounded-r-lg",
        currentPage === totalPages
      )}
    </div>
  );
}
