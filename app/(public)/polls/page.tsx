import { getActivePolls } from "@/app/actions/polls";
import { PollCard } from "@/components/polls/PollCard";
import { PollCategory } from "@/lib/polls/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Campus Polls | Voice of UPSA",
  description: "Have your say on matters concerning the UPSA student body.",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PollsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category as PollCategory | undefined;
  const result = await getActivePolls(category);
  const polls = result.data || [];

  const categories = [
    { value: "", label: "All Polls" },
    { value: "academics", label: "Academics" },
    { value: "campus_life", label: "Campus Life" },
    { value: "events", label: "Events" },
    { value: "sports", label: "Sports" },
    { value: "opinion", label: "Opinion" },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-upsa-navy mb-4 tracking-tight">Campus Polls</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Have your say on matters concerning the UPSA student body. Your voice matters.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {categories.map((c) => (
          <Button
            key={c.value}
            variant={category === c.value || (!category && c.value === "") ? "default" : "outline"}
            className={
              category === c.value || (!category && c.value === "")
                ? "bg-upsa-navy text-white hover:bg-upsa-navy/90 rounded-full"
                : "rounded-full"
            }
            asChild
          >
            <Link href={c.value ? `/polls?category=${c.value}` : "/polls"}>
              {c.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {polls.length > 0 ? (
          polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <h3 className="text-lg font-bold text-gray-700 mb-2">No active polls found</h3>
            <p className="text-gray-500">
              There are currently no polls {category ? `in the ${category.replace("_", " ")} category` : 'available'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
