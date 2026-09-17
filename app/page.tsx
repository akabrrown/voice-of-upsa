import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BreakingNews } from "@/components/layout/BreakingNews";
import { FeaturedStories } from "@/components/articles/FeaturedStories";
import { CategoryGrid } from "@/components/layout/CategoryGrid";
import { LatestArticles } from "@/components/articles/LatestArticles";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdZone } from "@/components/layout/AdZone";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Breaking News Ticker */}
        <BreakingNews />

        {/* Top Leaderboard Ad */}
        <div className="container mx-auto px-4 py-6 hidden md:block">
          <AdZone type="leaderboard" className="mx-auto" />
        </div>

        {/* Featured Stories Section */}
        <FeaturedStories />

        {/* Category Shortcuts */}
        <CategoryGrid />

        {/* Main Content Area */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Left Column: Latest News */}
            <div className="flex-1">
              <LatestArticles />
              
              {/* In-feed Ad after latest articles */}
              <div className="my-12">
                <AdZone type="in-feed" />
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <div className="w-full lg:w-80 space-y-8">
              <TrendingSidebar />
              
              {/* Sidebar Ad */}
              <AdZone type="sidebar" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
