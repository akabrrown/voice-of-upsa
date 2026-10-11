import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "./ProductDetailClient";

export const dynamic = "force-dynamic";

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

async function getProductBySlugOrId(identifier: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("products")
    .select(`
      *,
      store:store_id(*),
      category:category_id(*),
      images:product_images(*)
    `)
    .is("deleted_at", null);

  if (isUUID(identifier)) {
    query = query.eq("id", identifier);
  } else {
    query = query.eq("slug", identifier);
  }

  const { data, error } = await query.single();
  if (error || !data) {
    return null;
  }
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);

  if (!product) {
    return { title: "Product Not Found | Campus Mart" };
  }

  return {
    title: `${product.name} | Campus Mart - Voice of UPSA`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} safely on UPSA Campus Mart.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlugOrId(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            <Link href="/mart" className="hover:text-upsa-navy transition-colors">
              Campus Mart
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <Link href="/mart/products" className="hover:text-upsa-navy transition-colors">
              Products
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <Link
                  href={`/mart/products?category=${product.category.id}`}
                  className="hover:text-upsa-navy transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-upsa-navy truncate max-w-[200px] sm:max-w-xs font-bold">
              {product.name}
            </span>
          </div>

          <Link
            href="/mart/products"
            className="hidden sm:inline-flex items-center gap-1 text-gray-500 hover:text-upsa-navy transition-colors shrink-0 ml-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to listings
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <ProductDetailClient product={product} />
      </div>
    </main>
  );
}
