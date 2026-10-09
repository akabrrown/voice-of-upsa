"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Lock, HeartHandshake, ShieldAlert, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export default function NewConfessionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "confession",
    category: "campus_life",
    body_text: "",
    acknowledgment_confirmed: false,
  });

  const [selfHarmWarning, setSelfHarmWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acknowledgment_confirmed) {
      toast.error("Please confirm the acknowledgment before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSelfHarmWarning(false);
    
    try {
      const res = await fetch("/api/confessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.data.screening_flag === 'self_harm') {
          setSelfHarmWarning(true);
          toast.warning("Your post was submitted but is held for review.");
        } else if (data.data.status === 'pending_review') {
          toast.success("Post submitted and is pending moderation review.");
          router.push("/confessions/mine");
        } else {
          toast.success("Post published successfully!");
          router.push("/confessions");
        }
      } else {
        toast.error(data.error || "Failed to submit");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selfHarmWarning) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <HeartHandshake className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 font-bold text-lg">You are not alone</AlertTitle>
          <AlertDescription className="text-red-700 mt-2 space-y-4">
            <p>
              Your post has been securely submitted for review, but our system noticed language that suggests you might be going through a very difficult time.
            </p>
            <p>
              Please consider reaching out to the UPSA Counseling Unit. They are here to support you confidentially.
            </p>
            <div className="pt-4">
              <Button asChild variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50">
                <Link href="/services/counseling-unit">View Counseling Resources</Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <div className="mt-8">
          <Button variant="ghost" onClick={() => router.push("/confessions")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Confessions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="mb-8 space-y-2">
        <Link href="/confessions" className="text-sm font-medium text-gray-500 hover:text-upsa-navy flex items-center mb-6">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to feed
        </Link>
        <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Post Anonymously</h1>
        <p className="text-gray-500">Share your thoughts, experiences, or opinions with the UPSA community.</p>
      </div>

      <Alert className="mb-8 bg-blue-50/50 border-blue-100">
        <Lock className="h-5 w-5 text-blue-500" />
        <AlertTitle className="text-blue-800 font-bold">Important Privacy Notice</AlertTitle>
        <AlertDescription className="text-blue-700 mt-1 text-sm">
          Your post will appear without your name or profile. However, this is a <strong>pseudo-anonymous</strong> system. 
          For trust and safety, the platform securely logs your account ID. In cases of severe policy violation (like specific, credible threats), trusted platform administrators can unmask your identity. 
          <strong> Do not use real names to target other students.</strong>
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-900">What are you sharing?</Label>
            <RadioGroup 
              value={formData.type}
              onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex-1 data-[state=checked]:border-upsa-gold data-[state=checked]:bg-upsa-gold/5" data-state={formData.type === 'confession' ? 'checked' : 'unchecked'} onClick={() => setFormData(prev => ({ ...prev, type: 'confession' }))}>
                <RadioGroupItem value="confession" id="r1" />
                <Label htmlFor="r1" className="cursor-pointer font-semibold">Confession</Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex-1 data-[state=checked]:border-upsa-gold data-[state=checked]:bg-upsa-gold/5" data-state={formData.type === 'opinion' ? 'checked' : 'unchecked'} onClick={() => setFormData(prev => ({ ...prev, type: 'opinion' }))}>
                <RadioGroupItem value="opinion" id="r2" />
                <Label htmlFor="r2" className="cursor-pointer font-semibold">Opinion</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-900">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
            >
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academics">Academics</SelectItem>
                <SelectItem value="campus_life">Campus Life</SelectItem>
                <SelectItem value="relationships">Relationships</SelectItem>
                <SelectItem value="humor">Humor</SelectItem>
                <SelectItem value="serious_support">Serious Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-bold text-gray-900">Your Message</Label>
              <span className={`text-xs font-semibold ${formData.body_text.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {formData.body_text.length}/500
              </span>
            </div>
            <Textarea 
              placeholder="What's on your mind? Keep it respectful."
              className="resize-none h-40"
              value={formData.body_text}
              onChange={(e) => setFormData(prev => ({ ...prev, body_text: e.target.value }))}
            />
          </div>

          <div className="flex items-start space-x-3 pt-4 border-t border-gray-100">
            <Checkbox 
              id="ack" 
              checked={formData.acknowledgment_confirmed}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acknowledgment_confirmed: checked as boolean }))}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="ack" className="text-sm font-semibold leading-relaxed cursor-pointer">
                I understand this post is pseudo-anonymous and I confirm it does not target specific individuals with harassment or threats.
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.push("/confessions")}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-upsa-navy hover:bg-upsa-navy/90 text-white min-w-[120px]"
            disabled={isSubmitting || !formData.acknowledgment_confirmed || formData.body_text.length === 0 || formData.body_text.length > 500}
          >
            {isSubmitting ? "Submitting..." : "Post Anonymously"}
          </Button>
        </div>
      </form>
    </div>
  );
}
