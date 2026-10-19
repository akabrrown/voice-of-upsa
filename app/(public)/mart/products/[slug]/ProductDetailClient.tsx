"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  Store as StoreIcon, 
  Flag, 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  Truck, 
  MessageCircle, 
  Share2, 
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ReportModal } from "@/components/common/ReportModal";

interface ProductDetailClientProps {
  product: any;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: "/images/placeholder-product.jpg" }];

  const activeImage = images[selectedImageIndex]?.url || images[0]?.url || "/images/placeholder-product.jpg";

  const isDiscounted = product.discount_price != null && product.discount_price < product.price;
  const currentPrice = isDiscounted ? product.discount_price : product.price;
  const originalPrice = product.price;
  const savings = isDiscounted ? originalPrice - currentPrice : 0;

  const inStock = (product.stock_qty || 0) > 0;
  const isLowStock = inStock && product.stock_qty <= 5;

  const handleAddToCart = async () => {
    if (!inStock) return;
    setIsAddingToCart(true);

    try {
      const res = await fetch("/api/mart/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      });

      if (res.status === 401) {
        toast.info("Please sign in to add items to your cart.", {
          action: {
            label: "Sign In",
            onClick: () => router.push(`/auth/login?next=/mart/products/${product.slug || product.id}`),
          },
        });
        return;
      }

      if (res.ok) {
        toast.success(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`, {
          action: {
            label: "View Cart",
            onClick: () => router.push("/mart/cart"),
          },
        });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add item to cart.");
      }
    } catch {
      toast.error("Could not reach server. Please check your connection.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!inStock) return;
    setIsBuyingNow(true);

    try {
      const res = await fetch("/api/mart/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      });

      if (res.status === 401) {
        router.push(`/auth/login?next=/mart/cart`);
        return;
      }

      if (res.ok) {
        router.push("/mart/cart");
      } else {
        const data = await res.json();
        toast.error(data.error || "Unable to proceed to checkout.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on UPSA Campus Mart!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Image Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#0C1729] border border-gray-100 dark:border-white/10 shadow-sm">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
            {isDiscounted && (
              <div className="absolute top-4 left-4 bg-red-600 text-white font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow">
                Save GHS {savings}
              </div>
            )}
            <div className="absolute top-4 right-4">
              <button
                onClick={handleShare}
                className="bg-white/80 hover:bg-white dark:bg-[#0C1729]/80 dark:hover:bg-[#0C1729] text-gray-700 dark:text-gray-200 p-2.5 rounded-full shadow-sm backdrop-blur-sm transition-all"
                title="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img: any, idx: number) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? "border-upsa-navy dark:border-upsa-gold ring-2 ring-upsa-navy/20 dark:ring-upsa-gold/20 scale-95"
                      : "border-gray-200 dark:border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          
          {/* Category & Status */}
          <div className="flex items-center gap-3">
            {product.category && (
              <span className="text-xs font-bold text-upsa-navy dark:text-upsa-gold uppercase tracking-widest bg-upsa-navy/5 dark:bg-white/10 px-3 py-1 rounded-full">
                {product.category.name}
              </span>
            )}
            <Badge variant="outline" className="text-xs uppercase tracking-wider border-gray-300 dark:border-white/10 dark:text-gray-300">
              Condition: {product.condition ? product.condition.replace('_', ' ') : 'Standard'}
            </Badge>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-upsa-navy dark:text-white tracking-tight leading-tight">
              {product.name}
            </h1>
          </div>

          {/* Pricing */}
          <div className="p-5 rounded-2xl bg-gray-50/80 dark:bg-[#0C1729] border border-gray-100 dark:border-white/10 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-upsa-navy dark:text-white">
                GHS {currentPrice}
              </span>
              {isDiscounted && (
                <span className="text-lg text-gray-400 line-through font-semibold">
                  GHS {originalPrice}
                </span>
              )}
            </div>
            {isDiscounted && (
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Special campus discount active
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {inStock ? (
              <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full ${
                isLowStock ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300' : 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300'
              }`}>
                <Check className="w-3.5 h-3.5 mr-1" />
                {isLowStock ? `Only ${product.stock_qty} left in stock!` : `In Stock (${product.stock_qty} available)`}
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300">
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity Selector & Action Buttons */}
          {inStock && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quantity</span>
                <div className="flex items-center border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#060D1A] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock_qty, quantity + 1))}
                    disabled={quantity >= product.stock_qty}
                    className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isBuyingNow}
                  variant="outline"
                  className="flex-1 h-14 rounded-xl text-upsa-navy dark:text-white border-2 border-upsa-navy dark:border-white/20 font-bold hover:bg-upsa-navy hover:text-white dark:hover:bg-white/10 transition-all text-base shadow-sm"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={isAddingToCart || isBuyingNow}
                  className="flex-1 h-14 rounded-xl bg-upsa-gold text-upsa-navy dark:text-upsa-navy hover:bg-upsa-gold/90 font-bold transition-all text-base shadow-md"
                >
                  {isBuyingNow ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Store / Seller Card */}
          {product.store && (
            <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1729] flex items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-upsa-navy/10 dark:bg-upsa-gold/15 flex items-center justify-center shrink-0">
                  <StoreIcon className="w-5 h-5 text-upsa-navy dark:text-upsa-gold" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                    {product.store.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    {product.store.location || "UPSA Campus Seller"}
                  </p>
                </div>
              </div>

              <Button asChild variant="ghost" size="sm" className="text-xs text-upsa-navy dark:text-upsa-gold font-bold hover:bg-transparent dark:hover:bg-white/5">
                <Link href={`/mart/seller/${product.store.slug || product.store.id}`}>
                  View Shop
                </Link>
              </Button>
            </div>
          )}

          {/* Campus Delivery Guarantee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-blue-200">
                <strong className="block font-bold">Campus Delivery Points</strong>
                Available for pickup at Hostels, Library, and Student Centre.
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <strong className="block font-bold">Pay on Delivery</strong>
                Inspect your item in person on campus before paying.
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-6 border-t border-gray-100 dark:border-white/10 space-y-3">
              <h3 className="text-base font-bold text-upsa-navy dark:text-white">Product Description</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          )}

          {/* Report Button */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              disabled={isReported}
              className={`text-xs flex items-center gap-1.5 transition-colors ${
                isReported ? 'text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              {isReported ? "Listing Flagged" : "Report this listing"}
            </button>
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        resourceType="mart_product"
        resourceId={product.id}
        resourceTitle={product.name}
        onSuccess={() => setIsReported(true)}
      />
    </>
  );
}
