"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to subscribe.");
      }

      setIsSubscribed(true);
      toast.success(data.message || "Subscribed successfully!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-4 text-center space-y-2 animate-in fade-in duration-300">
        <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
        <p className="text-xs font-semibold text-white">You're on the list!</p>
        <p className="text-[11px] text-emerald-200/80">Expect curated campus news in your inbox every Friday.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 relative z-10">
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your student or personal email"
          disabled={isSubmitting}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-upsa-gold focus:ring-1 focus:ring-upsa-gold transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-upsa-gold text-upsa-navy font-bold py-2.5 rounded-lg text-xs hover:bg-white transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-60 shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Subscribing...</span>
          </>
        ) : (
          <span>Subscribe to Weekly Digest</span>
        )}
      </button>
    </form>
  );
}
