"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setIsSubscribed(true);
        if (data.alreadySubscribed) {
          toast.info(data.message || "You are already subscribed to the Voice of UPSA Weekly Digest!");
        } else {
          toast.success("Successfully subscribed to the Voice of UPSA Weekly Digest!");
          setEmail("");
        }
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch {
      toast.error("An unexpected error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div
        role="status"
        className="w-full max-w-sm p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-left space-y-1 animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>You&apos;re on the list!</span>
        </div>
        <p className="text-xs text-emerald-200/90 leading-relaxed">
          Look out for curated UPSA highlights in your inbox every Friday morning.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-2.5">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch">
        <div className="relative flex-1">
          <label htmlFor="footer-newsletter-email" className="sr-only">
            Student or personal email address for weekly newsletter
          </label>
          <Mail
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="footer-newsletter-email"
            type="email"
            placeholder="Enter your email address..."
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="pl-10 pr-3 h-12 w-full bg-white/10 dark:bg-black/30 border border-white/20 text-white placeholder:text-slate-400 focus:bg-white/15 focus:border-upsa-gold rounded-xl text-xs sm:text-sm transition-all"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
          aria-label="Subscribe to weekly campus highlights"
          className="h-12 px-5 rounded-xl bg-upsa-gold text-upsa-navy hover:bg-white hover:text-upsa-navy font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all duration-300 active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <span>Subscribe</span>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-slate-300 pl-1 leading-normal">
        Join <span className="font-bold text-white">4,500+</span> students receiving our weekly campus highlights.
      </p>
    </form>
  );
}
