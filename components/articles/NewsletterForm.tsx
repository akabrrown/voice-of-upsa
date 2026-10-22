"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to subscribe.");
      }

      setIsSubscribed(true);
      if (data.alreadySubscribed) {
        toast.info(data.message || "You are already subscribed to the Voice of UPSA Weekly Digest!");
      } else {
        toast.success(data.message || "Subscribed successfully!");
        setEmail("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div
        role="status"
        className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-4 text-center space-y-1.5 animate-in fade-in zoom-in-95 duration-300"
      >
        <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" aria-hidden="true" />
        <p className="text-xs font-bold text-white">You&apos;re on the list!</p>
        <p className="text-[11px] text-emerald-200/90 leading-relaxed">
          Expect curated campus news in your inbox every Friday morning.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 relative z-10">
      <div>
        <label htmlFor="sidebar-newsletter-email" className="sr-only">
          Email address for campus weekly digest
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="sidebar-newsletter-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your student email..."
            disabled={isSubmitting}
            className="w-full pl-10 pr-3 h-11 rounded-xl bg-white/10 dark:bg-black/30 border border-white/20 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-upsa-gold focus:ring-2 focus:ring-upsa-gold/30 transition-all"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !email.trim()}
        aria-label="Subscribe to weekly digest"
        className="w-full h-11 bg-upsa-gold text-upsa-navy font-bold rounded-xl text-xs sm:text-sm hover:bg-white hover:text-upsa-navy transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-md active:scale-95 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Subscribing...</span>
          </>
        ) : (
          <>
            <span>Subscribe to Weekly Digest</span>
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
          </>
        )}
      </button>
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300 pt-0.5">
        <ShieldCheck className="h-3 w-3 text-upsa-gold shrink-0" aria-hidden="true" />
        <span>100% spam-free. Unsubscribe anytime.</span>
      </div>
    </form>
  );
}
