"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { SocialMediaButtons } from "@/components/shared/SocialMediaButtons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setIsSubmitting(false);
      (e.target as HTMLFormElement).reset();
    }, 2000);
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {/* Contact Info */}
                <div className="space-y-12">
                  <div>
                    <h1 className="text-4xl font-black text-upsa-navy mb-4 tracking-tight">Get in Touch</h1>
                    <p className="text-gray-500">
                      Have a story to share or want to inquire about advertisements? Our team is ready to assist you.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-upsa-navy rounded-xl text-white">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-upsa-navy">Location</h3>
                        <p className="text-sm text-gray-500">UPSA, Legon, Accra - Ghana</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-upsa-navy rounded-xl text-white">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-upsa-navy">Email</h3>
                        <p className="text-sm text-gray-500">voice.of.upsa.mail@gmail.com</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-upsa-navy rounded-xl text-white">
                        <Phone className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-upsa-navy">Phone</h3>
                        <p className="text-sm text-gray-500">+233 (0) 302 500 722</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="font-bold text-upsa-navy mb-4">Follow Us</h3>
                      <SocialMediaButtons />
                    </div>
                  </div>

                  {/* Embedded Map Placeholder */}
                  <div className="aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                    <iframe 
                      src="https://maps.google.com/maps?q=5.660916385864919,-0.16702582776741334&z=15&output=embed" 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-bold text-upsa-navy uppercase">Full Name</Label>
                      <Input id="name" name="name" placeholder="Your full name" required className="rounded-xl text-xs py-5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-upsa-navy uppercase">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="name@domain.com" required className="rounded-xl text-xs py-5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-xs font-bold text-upsa-navy uppercase">Subject</Label>
                      <Input id="subject" name="subject" placeholder="What is your message regarding?" required className="rounded-xl text-xs py-5" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="message" className="text-xs font-bold text-upsa-navy uppercase">Message</Label>
                      <textarea 
                        id="message" 
                        name="message"
                        rows={5} 
                        className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-upsa-navy focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Type your message here..."
                        required
                      ></textarea>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy py-5 text-xs font-bold rounded-xl transition-colors cursor-pointer gap-2"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {isSubmitting ? "Sending Message..." : "Send Message"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
