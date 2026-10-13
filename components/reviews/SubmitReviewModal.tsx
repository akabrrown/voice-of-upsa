"use client";

import { useState } from "react";
import { Star, MessageSquarePlus, X, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SubmitReviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const router = useRouter();

  const handleOpenClick = async () => {
    setIsCheckingAuth(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsCheckingAuth(false);
    
    if (!user) {
      toast.error("You must have an account to review. Please log in.");
      router.push("/auth/login");
      return;
    }
    setStep(1);
    setIsOpen(true);
  };

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating!");
      return;
    }
    if (content.trim().length < 10) {
      toast.error("Your review must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to leave a review.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, content })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Thank you! Your review has been submitted for approval.");
        setIsOpen(false);
        setRating(0);
        setContent("");
        setStep(1);
        // Force a page refresh to show the newly approved review
        router.refresh();
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch (e) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpenClick}
        variant="outline"
        disabled={isCheckingAuth}
        className="rounded-full shadow-sm hover:shadow-md border-upsa-gold/30 bg-white dark:bg-[#0C1729] dark:border-white/10 hover:bg-upsa-gold/5 dark:hover:bg-white/10 text-upsa-navy dark:text-white transition-all"
      >
        {isCheckingAuth ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-upsa-gold" />
        ) : (
          <MessageSquarePlus className="w-4 h-4 mr-2 text-upsa-gold" />
        )}
        Leave a Review
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0C1729] border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-[#060D1A]/50">
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button 
                    onClick={() => setStep(1)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {step === 1 ? "Rate your experience" : "Share more details"}
                </h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {step === 1 ? (
                <div className="flex flex-col items-center justify-center space-y-6 py-8">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tap a star to rate</span>
                  <div 
                    className="flex gap-3"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star 
                          className={`w-12 h-12 transition-colors ${
                            star <= (hoverRating || rating) 
                              ? "fill-upsa-gold text-upsa-gold" 
                              : "fill-gray-100 dark:fill-white/5 text-gray-200 dark:text-white/10"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-5 h-5 ${
                            star <= rating 
                              ? "fill-upsa-gold text-upsa-gold" 
                              : "fill-gray-100 dark:fill-white/5 text-gray-200 dark:text-white/10"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Review</label>
                    <Textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="What do you think about Voice of UPSA? How has it helped you?"
                      className="min-h-[140px] resize-none focus:ring-upsa-gold/20 dark:bg-[#060D1A] dark:border-white/10 dark:text-white dark:placeholder-gray-500"
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                      {content.length} characters (min 10)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="submit" 
                      className="w-full bg-upsa-navy dark:bg-upsa-gold hover:bg-upsa-navy/90 dark:hover:bg-white text-white dark:text-upsa-navy font-bold py-6 transition-all"
                      disabled={isSubmitting || content.length < 10}
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
