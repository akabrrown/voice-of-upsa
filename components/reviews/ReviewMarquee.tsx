"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  rating: number;
  content: string;
  created_at: string;
  is_featured: boolean;
  profiles: {
    full_name: string;
    avatar_url: string;
    department: string;
  };
}

export function ReviewMarquee() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
        }
      } catch (e) {
        console.error("Failed to fetch reviews", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  if (isLoading) {
    return <div className="h-40 w-full flex items-center justify-center animate-pulse bg-gray-50/50 rounded-xl" />;
  }

  if (reviews.length === 0) {
    return null; // Don't show if no approved reviews exist
  }

  // Duplicate for seamless infinite scrolling
  const displayReviews = [...reviews, ...reviews, ...reviews];

  return (
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-transparent via-gray-50/30 to-transparent py-10">
      
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 1rem)); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="flex w-max gap-4 animate-scroll px-4">
        {displayReviews.map((review, i) => (
          <div 
            key={`${review.id}-${i}`} 
            className="w-[350px] shrink-0 rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-md p-6 shadow-sm hover:shadow-md hover:bg-white transition-all"
          >
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < review.rating ? 'fill-upsa-gold text-upsa-gold' : 'fill-gray-100 text-gray-200'}`} 
                />
              ))}
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-6 line-clamp-4">
              "{review.content}"
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <Avatar className="h-10 w-10 border border-gray-100">
                <AvatarImage src={review.profiles.avatar_url || ""} />
                <AvatarFallback className="bg-upsa-navy/5 text-upsa-navy text-xs font-bold">
                  {review.profiles.full_name?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{review.profiles.full_name || "Anonymous User"}</span>
                <span className="text-xs text-gray-500">{review.profiles.department || "Student"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
