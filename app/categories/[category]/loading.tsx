import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ArticleGridShadowLoader } from "@/components/ui/shadow-loaders";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Banner Skeleton */}
        <div className="h-64 sm:h-80 w-full bg-gray-100 animate-pulse relative flex items-center">
          <div className="container mx-auto px-4 space-y-3">
            <Skeleton className="h-8 w-48 bg-gray-300" />
            <Skeleton className="h-4 w-96 max-w-full bg-gray-300" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-12">
          <ArticleGridShadowLoader count={6} />
        </div>
      </main>
      <Footer />
    </>
  );
}
