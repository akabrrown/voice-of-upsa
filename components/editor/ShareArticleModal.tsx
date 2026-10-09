"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleSlug: string;
  articleTitle: string;
}

export function ShareArticleModal({ isOpen, onClose, articleSlug, articleTitle }: ShareArticleModalProps) {
  const [copied, setCopied] = useState(false);
  const articleUrl = `https://voiceofupsa.com/articles/${articleSlug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Read this new article: ${articleTitle}\n${articleUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnTwitter = () => {
    const text = `Check out this new article from Voice of UPSA: ${articleTitle}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(articleUrl)}`, "_blank");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-upsa-gold/10 via-white to-upsa-navy/5 -z-10" />
        <DialogHeader className="text-center pt-6 pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <Share2 className="w-8 h-8 text-green-600 ml-1" />
          </div>
          <DialogTitle className="text-2xl font-black text-upsa-navy tracking-tight">
            Published Successfully! 🎉
          </DialogTitle>
          <DialogDescription className="text-gray-600 font-medium">
            Your article is now live. Influence the campus by sharing it on your socials to maximize readership!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-2">
            <Input 
              readOnly 
              value={articleUrl} 
              className="bg-gray-50 border-gray-200 text-gray-500 font-mono text-sm"
            />
            <Button size="icon" variant="outline" className="shrink-0 border-gray-200 hover:bg-gray-100" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={shareOnWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white shadow-md shadow-green-200 transition-all font-bold"
            >
              <MessageCircle className="w-4 h-4 mr-2" /> Share on WhatsApp
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={shareOnTwitter}
                variant="outline" 
                className="w-full border-gray-200 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/30 transition-all font-semibold"
              >
                <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg> Twitter / X
              </Button>
              <Button 
                onClick={shareOnFacebook}
                variant="outline" 
                className="w-full border-gray-200 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30 transition-all font-semibold"
              >
                <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center pt-2 pb-4">
          <Button 
            type="button" 
            variant="ghost" 
            className="text-gray-500 hover:text-upsa-navy hover:bg-gray-100 font-bold px-8"
            onClick={onClose}
          >
            I'm done sharing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
