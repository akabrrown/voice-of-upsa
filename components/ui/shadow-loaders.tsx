import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * 1. Stats Cards Shadow Loader (Dashboard Overview & Analytics)
 */
export function StatsShadowLoader({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 2. Table Shadow Loader (Articles, Users, Ads, Documents)
 */
export function TableShadowLoader({ 
  rows = 6, 
  columns = 5,
  hasSearch = true 
}: { 
  rows?: number; 
  columns?: number;
  hasSearch?: boolean;
}) {
  return (
    <div className="space-y-4">
      {hasSearch && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Skeleton className="h-10 w-full sm:w-72 rounded-lg" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        {/* Table Header Skeleton */}
        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-4 w-20 hidden md:block" />
          <Skeleton className="h-4 w-24 hidden lg:block" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4 max-w-sm" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
              <Skeleton className="h-4 w-20 hidden md:block" />
              <Skeleton className="h-6 w-16 rounded-md hidden lg:block" />
              <div className="flex gap-2 shrink-0">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 3. Chart Shadow Loader (Analytics & Dashboard Charts)
 */
export function ChartShadowLoader({ height = "h-80" }: { height?: string }) {
  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className={`${height} flex items-end gap-3 pt-6 pb-2 px-6`}>
        <Skeleton className="h-1/3 flex-1 rounded-t-md" />
        <Skeleton className="h-2/3 flex-1 rounded-t-md" />
        <Skeleton className="h-4/5 flex-1 rounded-t-md" />
        <Skeleton className="h-1/2 flex-1 rounded-t-md" />
        <Skeleton className="h-3/4 flex-1 rounded-t-md" />
        <Skeleton className="h-2/5 flex-1 rounded-t-md" />
        <Skeleton className="h-5/6 flex-1 rounded-t-md" />
      </CardContent>
    </Card>
  );
}

/**
 * 4. Article Grid Shadow Loader (Search, Categories, Bookmarks)
 */
export function ArticleGridShadowLoader({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm space-y-4 pb-4">
          <Skeleton className="aspect-video w-full" />
          <div className="px-5 space-y-3">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
            <div className="pt-2 flex items-center justify-between border-t border-gray-50">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="h-3.5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 5. Form Shadow Loader (Article Editor / Creator / Settings)
 */
export function FormShadowLoader() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      {/* Main input fields */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Cover image placeholder */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="aspect-video md:aspect-[21/9] w-full rounded-2xl" />
        </div>

        {/* Content editor placeholder */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * 6. Profile Shadow Loader
 */
export function ProfileShadowLoader() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="space-y-3 flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Skeleton className="h-7 w-48 mx-auto sm:mx-0" />
            <Skeleton className="h-6 w-20 rounded-full mx-auto sm:mx-0" />
          </div>
          <Skeleton className="h-4 w-36 mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-full max-w-md mx-auto sm:mx-0" />
          <Skeleton className="h-9 w-28 rounded-lg mx-auto sm:mx-0" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4 border-b border-gray-100 pb-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
        <ArticleGridShadowLoader count={3} />
      </div>
    </div>
  );
}
