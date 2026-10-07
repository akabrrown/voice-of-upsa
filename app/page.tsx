import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BreakingNews } from "@/components/layout/BreakingNews";
import { FeaturedStories } from "@/components/articles/FeaturedStories";
import { CategoryGrid } from "@/components/layout/CategoryGrid";
import { LatestArticles } from "@/components/articles/LatestArticles";
import { TrendingSidebar } from "@/components/articles/TrendingSidebar";
import { AdZone } from "@/components/layout/AdZone";
import { ReviewMarquee } from "@/components/reviews/ReviewMarquee";
import { SubmitReviewModal } from "@/components/reviews/SubmitReviewModal";

export default function Home() {
  return (
    <>
      <Navbar />
      <BreakingNews />
      <main className="flex-1">

        {/* Top Leaderboard Ad */}
        <div className="container mx-auto px-4 py-6">
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
        {/* Reviews Section */}
        <section className="border-t border-gray-100 bg-white pt-16 pb-8 mt-12">
          <div className="container mx-auto px-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold font-playfair text-upsa-navy mb-2">What Our Readers Say</h2>
              <p className="text-gray-500">Join the conversation and share your experience with Voice of UPSA.</p>
            </div>
            <SubmitReviewModal />
          </div>
          <ReviewMarquee />
        </section>
      </main>
      <Footer />
    </>
  );
}
