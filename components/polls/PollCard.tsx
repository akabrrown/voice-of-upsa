"use client";

import { useState } from "react";
import { PollWithDetails } from "@/lib/polls/types";
import { castVote } from "@/app/actions/polls";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Clock } from "lucide-react";

interface PollCardProps {
  poll: PollWithDetails;
  isDetailedView?: boolean;
}

export function PollCard({ poll, isDetailedView = false }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isVoting, setIsVoting] = useState(false);

  const hasVoted = !!poll.user_voted_option_id;
  const isClosed = poll.status === "closed" || (poll.expires_at && new Date(poll.expires_at) < new Date());
  
  const canSeeResults = 
    poll.results_visibility === "always" || 
    (poll.results_visibility === "after_vote" && hasVoted) ||
    (poll.results_visibility === "after_close" && isClosed) ||
    isClosed;

  const showVotingForm = !hasVoted && !isClosed;

  const handleVote = async () => {
    if (!selectedOption) return;
    setIsVoting(true);
    
    const result = await castVote(poll.id, selectedOption);
    
    if (result.success) {
      toast.success(result.message || "Vote recorded!");
    } else {
      toast.error(result.error || "Failed to record vote.");
    }
    
    setIsVoting(false);
  };

  const getPercentage = (count: number) => {
    if (poll.total_votes === 0) return 0;
    return Math.round((count / poll.total_votes) * 100);
  };

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-upsa-gold bg-upsa-navy px-2.5 py-1 rounded-full">
            {poll.category.replace("_", " ")}
          </span>
          {isClosed ? (
            <span className="text-xs font-medium text-gray-500 flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3 mr-1" /> Closed
            </span>
          ) : poll.expires_at ? (
            <span className="text-xs font-medium text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
              <Clock className="w-3 h-3 mr-1" />
              Ends {formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}
            </span>
          ) : null}
        </div>
        <CardTitle className="text-xl md:text-2xl leading-snug text-[#1B2A4A] mt-2">
          {poll.question}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2">
          <span>{poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}</span>
          {hasVoted && (
            <span className="flex items-center text-green-600 font-medium">
              • <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 mr-1" /> You voted
            </span>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {showVotingForm ? (
          <div className="space-y-4">
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="gap-3">
              {poll.options.sort((a, b) => a.sort_order - b.sort_order).map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} className="text-upsa-navy" />
                  <Label htmlFor={option.id} className="text-base font-normal cursor-pointer w-full p-1 leading-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : canSeeResults ? (
          <div className="space-y-5">
            {poll.options.sort((a, b) => a.sort_order - b.sort_order).map((option) => {
              const percentage = getPercentage(option.vote_count);
              const isUserChoice = poll.user_voted_option_id === option.id;
              
              return (
                <div key={option.id} className="space-y-1.5 relative">
                  <div className="flex justify-between text-sm font-medium">
                    <span className={`flex items-center ${isUserChoice ? 'text-upsa-navy font-bold' : 'text-gray-700'}`}>
                      {option.label}
                      {isUserChoice && <CheckCircle2 className="w-4 h-4 ml-1.5 text-green-500 inline" />}
                    </span>
                    <span className="text-gray-600">{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2.5 ${isUserChoice ? 'bg-upsa-navy/10 [&>div]:bg-upsa-navy' : 'bg-gray-100 [&>div]:bg-gray-400'}`} 
                  />
                  <span className="text-xs text-gray-500 absolute -bottom-4 right-0">
                    {option.vote_count} votes
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-100 text-gray-500 text-sm">
            Results are hidden until {poll.results_visibility === "after_vote" ? "you cast your vote" : "the poll closes"}.
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-6">
        {showVotingForm ? (
          <Button 
            onClick={handleVote} 
            disabled={!selectedOption || isVoting} 
            className="w-full bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy transition-colors rounded-xl font-bold"
          >
            {isVoting ? "Casting vote..." : "Submit Vote"}
          </Button>
        ) : !isDetailedView ? (
          <Button asChild variant="outline" className="w-full rounded-xl">
            <a href={`/polls/${poll.slug}`}>View Details</a>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
