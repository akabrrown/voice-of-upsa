"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePoll } from "@/app/actions/polls";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, ChevronLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface EditPollClientProps {
  poll: {
    id: string;
    slug: string;
    question: string;
    category: string;
    status: string;
    results_visibility: string;
    expires_at?: string | null;
    total_votes: number;
    options: { id: string; label: string; sort_order: number; vote_count: number }[];
  };
}

export function EditPollClient({ poll }: EditPollClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [options, setOptions] = useState<string[]>(
    poll.options.sort((a, b) => a.sort_order - b.sort_order).map((o) => o.label)
  );

  const hasVotes = poll.total_votes > 0;

  const addOption = () => {
    if (hasVotes) return;
    if (options.length >= 6) return toast.error("Maximum 6 options allowed.");
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (hasVotes) return;
    if (options.length <= 2) return toast.error("Minimum 2 options required.");
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    if (hasVotes) return;
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.delete("options[]");
    options.forEach((opt) => formData.append("options[]", opt));

    const result = await updatePoll(poll.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(result.message || "Poll updated successfully!");
      router.push("/dashboard/admin/polls");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update poll");
    }
  };

  const defaultExpiresAt = poll.expires_at
    ? new Date(poll.expires_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/dashboard/admin/polls">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">Edit Poll</h1>
          <p className="text-sm text-gray-500">Update poll settings and options.</p>
        </div>
      </div>

      {hasVotes && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Votes have already been cast ({poll.total_votes} total)</p>
            <p className="text-xs text-amber-800 mt-1">
              To preserve voter integrity, options cannot be added, removed, or rewritten once voting has started. You can still modify the status, category, results visibility, and expiry date.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor="question" className="text-base font-semibold">
            Question
          </Label>
          <Textarea
            id="question"
            name="question"
            defaultValue={poll.question}
            required
            className="text-base resize-none"
            rows={3}
          />
        </div>

        {/* Category & Status & Visibility */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="font-semibold">
              Category
            </Label>
            <Select name="category" defaultValue={poll.category} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academics">Academics</SelectItem>
                <SelectItem value="campus_life">Campus Life</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="opinion">Opinion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-semibold">
              Status
            </Label>
            <Select name="status" defaultValue={poll.status} required>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published (Live immediately)</SelectItem>
                <SelectItem value="draft">Draft (Hidden)</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="results_visibility" className="font-semibold">
              Results Visibility
            </Label>
            <Select name="results_visibility" defaultValue={poll.results_visibility} required>
              <SelectTrigger>
                <SelectValue placeholder="When can students see results?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="after_vote">After voting (Recommended)</SelectItem>
                <SelectItem value="always">Always visible</SelectItem>
                <SelectItem value="after_close">Only after poll closes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_at" className="font-semibold">
              Expires At (Optional)
            </Label>
            <Input
              type="datetime-local"
              id="expires_at"
              name="expires_at"
              defaultValue={defaultExpiresAt}
              className="w-full"
            />
            <p className="text-xs text-gray-500">Leave blank for manual closing.</p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Options</Label>
            <span className="text-xs text-gray-500">{options.length}/6</span>
          </div>

          <div className="space-y-3">
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="bg-gray-100 text-gray-500 w-8 h-10 flex items-center justify-center rounded-md font-mono text-sm shrink-0">
                  {index + 1}
                </div>
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                  disabled={hasVotes}
                />
                {!hasVotes && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {!hasVotes && options.length < 6 && (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={addOption}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Option
            </Button>
          )}
        </div>

        <div className="pt-6 border-t flex justify-end gap-3">
          <Button type="button" variant="ghost" asChild>
            <Link href="/dashboard/admin/polls">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy font-bold px-8"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
