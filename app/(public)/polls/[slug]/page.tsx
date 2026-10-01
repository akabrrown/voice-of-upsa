import { getPollBySlug } from "@/app/actions/polls";
import { PollCard } from "@/components/polls/PollCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const result = await getPollBySlug(params.slug);
  if (!result.success || !result.data) {
    return { title: "Poll Not Found" };
  }
  return { title: `${result.data.question} | Campus Polls` };
}

export default async function PollDetailPage({ params }: { params: { slug: string } }) {
  const result = await getPollBySlug(params.slug);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const poll = result.data;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 sm:px-6">
      <Link href="/polls" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-upsa-navy mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Polls
      </Link>
      
      <PollCard poll={poll} isDetailedView={true} />
    </div>
  );
}
