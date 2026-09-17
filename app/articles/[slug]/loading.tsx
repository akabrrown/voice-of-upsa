import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ArticleLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white pt-10 pb-20">
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-200">
          <div className="max-w-4xl mx-auto mb-10 space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-12 w-full max-w-3xl" />
            <Skeleton className="h-10 w-2/3" />
            <div className="flex items-center space-x-4 pt-2 border-b border-gray-100 pb-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="aspect-video md:aspect-[16/9] w-full rounded-2xl" />
              <div className="space-y-3 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="rounded-xl border border-gray-100 p-6 space-y-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
