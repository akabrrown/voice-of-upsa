"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "react-hot-toast";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.alreadySubscribed) {
          toast.success(data.message);
        } else {
          toast.success("Successfully subscribed to the Voice of UPSA Weekly Digest!");
          setEmail("");
        }
      } else {
        toast.error(data.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full group">
      <div className="relative flex items-center w-full max-w-sm">
        <Mail className="absolute left-4 h-5 w-5 text-gray-400 group-focus-within:text-upsa-gold transition-colors duration-300 pointer-events-none" />
        <Input
          type="email"
          placeholder="Enter your student email..."
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="pl-12 pr-32 h-14 w-full bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-upsa-gold/50 rounded-2xl transition-all duration-300"
        />
        <div className="absolute right-1.5">
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="h-11 px-5 rounded-xl bg-upsa-gold text-upsa-navy hover:bg-white hover:text-upsa-navy font-bold tracking-wide transition-all duration-300 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline mr-2">Subscribe</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400 pl-2">
        Join <span className="font-bold text-gray-300">4,500+</span> students receiving our weekly campus highlights.
      </p>
    </form>
  );
}
