"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ServiceCategory } from "@/lib/types/services";

interface CategoryChipsProps {
  categories: ServiceCategory[];
}

export function CategoryChips({ categories }: CategoryChipsProps) {
  const pathname = usePathname();
  
  return (
    <div className="relative w-full mb-8">
      <div className="w-full overflow-x-auto pb-4 no-scrollbar">
        <div className="flex w-max space-x-2 px-1">
          <Link
            href="/services"
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
              pathname === "/services" 
                ? "bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy border-upsa-navy dark:border-upsa-gold font-bold" 
                : "bg-white dark:bg-[#0C1729] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-upsa-navy dark:hover:border-upsa-gold hover:text-upsa-navy dark:hover:text-upsa-gold"
            )}
          >
            All Services
          </Link>
          
          {categories.map((category) => {
            const isActive = pathname === `/services/category/${category.slug}`;
            return (
              <Link
                key={category.id}
                href={`/services/category/${category.slug}`}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  isActive 
                    ? "bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy border-upsa-navy dark:border-upsa-gold font-bold" 
                    : "bg-white dark:bg-[#0C1729] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-upsa-navy dark:hover:border-upsa-gold hover:text-upsa-navy dark:hover:text-upsa-gold"
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
