"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ArticleEndSubscriptionProps {
  categoryName?: string;
}

export function ArticleEndSubscription({ categoryName }: ArticleEndSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setErrorMessage("Please enter a valid student or personal email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to subscribe. Please try again.");
      }

      setIsSubscribed(true);
      setEmail("");
      if (data.alreadySubscribed) {
        toast.info(data.message || "You are already subscribed to the Voice of UPSA Weekly Digest!");
      } else {
        toast.success("Welcome aboard! You're subscribed to the Voice of UPSA Weekly Digest.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please check your connection and retry.");
      toast.error(err.message || "Failed to subscribe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="reading-subscribe-heading"
      className="my-10 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-upsa-navy via-[#0C1729] to-[#060D1A] dark:from-[#0C1729] dark:via-[#080F1E] dark:to-[#040810] border-2 border-upsa-gold/30 p-6 sm:p-10 shadow-2xl text-white transition-all duration-300"
    >
      {/* Ambient background glow */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-upsa-gold/15 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
        {/* Category-aware pill tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-upsa-gold/20 border border-upsa-gold/40 text-upsa-gold text-xs font-bold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{categoryName ? `Enjoyed this ${categoryName} story?` : "Voice of UPSA Digest"}</span>
        </div>

        <h3
          id="reading-subscribe-heading"
          className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight"
        >
          Never Miss an Exclusive Campus Story
        </h3>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Join over <strong className="text-white font-bold">4,500+</strong> students, faculty, and alumni. Get curated campus investigations, SRC policy updates, and academic deadlines delivered to your inbox every Friday morning.
        </p>

        {isSubscribed ? (
          <div
            role="status"
            className="p-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2 animate-in fade-in zoom-in-95 duration-300"
          >
            <div className="inline-flex p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-bold text-white">You&apos;re officially on the list!</h4>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-md mx-auto">
              Look out for our curated digest every Friday. Thank you for reading and supporting independent student journalism at UPSA.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-2 max-w-lg mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
              <div className="relative flex-1">
                <label htmlFor="article-end-newsletter-email" className="sr-only">
                  Email address for campus newsletter
                </label>
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="article-end-newsletter-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter your student or personal email..."
                  className="pl-12 pr-4 h-12 sm:h-14 w-full rounded-2xl bg-white/10 dark:bg-black/30 border-white/20 text-white placeholder:text-slate-400 text-sm focus:border-upsa-gold focus:ring-2 focus:ring-upsa-gold/30 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="h-12 sm:h-14 px-7 rounded-2xl bg-upsa-gold text-upsa-navy hover:bg-white hover:text-upsa-navy font-black text-sm tracking-wide shadow-lg hover:shadow-upsa-gold/30 transition-all duration-300 active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <span>Get Updates</span>
                    <Send className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
            </div>

            {errorMessage && (
              <p role="alert" className="text-xs text-rose-400 font-semibold text-left sm:text-center animate-in fade-in">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-upsa-gold" aria-hidden="true" />
                100% spam-free
              </span>
              <span>•</span>
              <span>1-click unsubscribe anytime</span>
              <span>•</span>
              <span>Every Friday morning</span>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
