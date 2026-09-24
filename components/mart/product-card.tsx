"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Product } from "@/lib/marketplace/types";

export function ProductCard({ product }: { product: Product }) {
  const isDiscounted = product.discount_price != null && product.discount_price < product.price;
  const priceToDisplay = isDiscounted ? product.discount_price : product.price;

  // Fallback image if none exists
  const coverImage = product.images?.[0]?.url || "/images/placeholder-product.jpg";

  return (
    <Link href={`/mart/products/${product.slug}`} className="group block h-full">
      <Card className="h-full flex flex-col rounded-none border border-border/60 bg-white shadow-none transition-colors duration-300 hover:border-upsa-navy">
        {/* Image Container with Hover Scale */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted">
          <Image
            src={coverImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Top Badges */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.condition === 'new' && (
              <Badge className="rounded-none bg-upsa-navy px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-none">
                New
              </Badge>
            )}
            {product.condition !== 'new' && (
              <Badge variant="secondary" className="rounded-none bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-upsa-navy shadow-none">
                {product.condition.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-5">
          {/* Store info (if available) */}
          {product.store && (
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-upsa-gold">
              {product.store.name}
            </div>
          )}

          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-upsa-navy">
            {product.name}
          </h3>

          {/* Pricing */}
          <div className="mt-auto flex items-end gap-2 pt-4">
            <span className="text-xl font-bold text-upsa-navy">
              GHS {priceToDisplay}
            </span>
            {isDiscounted && (
              <span className="text-sm font-medium text-muted-foreground line-through">
                GHS {product.price}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
