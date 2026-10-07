"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Star, Loader2, CheckCircle2, XCircle, Search, Pin, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminReview {
  id: string;
  rating: number;
  content: string;
  status: "pending" | "approved" | "rejected";
  is_featured: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string;
    course: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
      } else {
        toast.error("Failed to load reviews: " + data.error);
      }
    } catch (err) {
      toast.error("An error occurred while fetching reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateReview = async (id: string, updates: { status?: string, is_featured?: boolean }) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review updated successfully");
        setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      } else {
        toast.error("Failed to update: " + data.error);
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
    }
  };

  const filteredReviews = reviews.filter(r => filter === "all" || r.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-upsa-navy flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-upsa-gold" />
          Review Moderation
        </h1>
        <p className="text-sm text-gray-500 mt-1">Approve or reject user testimonials before they appear publicly.</p>
      </div>

      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map(f => (
          <Button 
            key={f}
            variant={filter === f ? "default" : "outline"}
            className={filter === f ? "bg-upsa-navy text-white hover:bg-upsa-navy/90" : ""}
            onClick={() => setFilter(f as any)}
            size="sm"
          >
            <span className="capitalize">{f}</span>
            <span className="ml-2 text-xs bg-black/10 px-1.5 rounded-full">
              {reviews.filter(r => f === "all" || r.status === f).length}
            </span>
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed bg-gray-50/50">
          <Search className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-1">No {filter !== "all" ? filter : ""} reviews found</h3>
          <p className="text-sm text-gray-400 text-center max-w-sm">
            When users submit new reviews, they will appear here for moderation.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map(review => (
            <Card key={review.id} className={`flex flex-col ${review.status === 'pending' ? 'ring-2 ring-amber-400/20' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-gray-100">
                      <AvatarImage src={review.profiles.avatar_url || ""} />
                      <AvatarFallback className="bg-gray-100 text-xs font-bold text-gray-600">
                        {review.profiles.full_name?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm font-bold text-gray-900">{review.profiles.full_name || "Anonymous"}</CardTitle>
                      <CardDescription className="text-xs">{review.profiles.email || "No email"}</CardDescription>
                    </div>
                  </div>
                  <div className="flex bg-gray-50 px-2 py-1 rounded-full">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-3 h-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} 
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-gray-700 italic mb-6 leading-relaxed flex-1">"{review.content}"</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {review.status !== "approved" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        onClick={() => updateReview(review.id, { status: "approved" })}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                      </Button>
                    )}
                    {review.status !== "rejected" && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => updateReview(review.id, { status: "rejected" })}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" /> Reject
                      </Button>
                    )}
                  </div>
                  
                  {review.status === "approved" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateReview(review.id, { is_featured: !review.is_featured })}
                      className={review.is_featured ? "text-upsa-gold bg-upsa-gold/10 hover:bg-upsa-gold/20" : "text-gray-400 hover:text-upsa-gold"}
                      title={review.is_featured ? "Remove from featured" : "Feature on homepage"}
                    >
                      <Pin className={`w-4 h-4 ${review.is_featured ? 'fill-upsa-gold' : ''}`} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
