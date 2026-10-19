"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPoll } from "@/app/actions/polls";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

export function CreatePollClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState(["", ""]);

  const addOption = () => {
    if (options.length >= 6) return toast.error("Maximum 6 options allowed.");
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return toast.error("Minimum 2 options required.");
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    // Options are handled via controlled state because standard FormData might miss empty inputs or mess up order if not named properly.
    // Let's clear the native ones and append our state
    formData.delete("options[]");
    options.forEach(opt => formData.append("options[]", opt));

    const result = await createPoll(formData);
    
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Poll created successfully!");
      router.push("/dashboard/admin/polls");
    } else {
      toast.error(result.error || "Failed to create poll");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10">
          <Link href="/dashboard/admin/polls"><ChevronLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-white">Create New Poll</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">Engage the student body with a new poll.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-[#0C1729] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10">
        
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor="question" className="text-base font-semibold text-gray-900 dark:text-white">Question</Label>
          <Textarea 
            id="question" 
            name="question" 
            placeholder="e.g., Should the library extend its opening hours during weekends?" 
            required 
            className="text-base resize-none bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
            rows={3}
          />
        </div>

        {/* Category & Status & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="font-semibold text-gray-900 dark:text-white">Category</Label>
            <Select name="category" defaultValue="campus_life" required>
              <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectItem value="academics">Academics</SelectItem>
                <SelectItem value="campus_life">Campus Life</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="opinion">Opinion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-semibold text-gray-900 dark:text-white">Status</Label>
            <Select name="status" defaultValue="published" required>
              <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectItem value="published">Published (Live immediately)</SelectItem>
                <SelectItem value="draft">Draft (Hidden)</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="results_visibility" className="font-semibold text-gray-900 dark:text-white">Results Visibility</Label>
            <Select name="results_visibility" defaultValue="after_vote" required>
              <SelectTrigger className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectValue placeholder="When can students see results?" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0C1729] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectItem value="after_vote">After voting (Recommended)</SelectItem>
                <SelectItem value="always">Always visible</SelectItem>
                <SelectItem value="after_close">Only after poll closes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at" className="font-semibold text-gray-900 dark:text-white">Expires At (Optional)</Label>
            <Input 
              type="datetime-local" 
              id="expires_at" 
              name="expires_at" 
              className="w-full bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400">Leave blank for manual closing.</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-gray-900 dark:text-white">Options</Label>
            <span className="text-xs text-gray-500 dark:text-slate-400">{options.length}/6</span>
          </div>
          
          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400 w-8 h-10 flex items-center justify-center rounded-md font-mono text-sm shrink-0">
                  {index + 1}
                </div>
                <Input 
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="bg-white dark:bg-[#060D1A] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
                  required
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full border-dashed border-gray-200 dark:border-white/20 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-white/5"
              onClick={addOption}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Option
            </Button>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
          <Button type="button" variant="ghost" asChild className="text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10">
            <Link href="/dashboard/admin/polls">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-gray-950 dark:hover:bg-upsa-gold/90 font-bold px-8">
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Poll
          </Button>
        </div>
      </form>
    </div>
  );
}
