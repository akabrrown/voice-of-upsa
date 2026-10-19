import Link from "next/link";
import { GraduationCap, Calendar, Newspaper, MessageSquare, Trophy, Star, Vote } from "lucide-react";

const categories = [
  { name: "Academics", icon: GraduationCap, href: "/categories/academics", color: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  { name: "Events", icon: Calendar, href: "/categories/events", color: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  { name: "News", icon: Newspaper, href: "/categories/news", color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  { name: "Opinions", icon: MessageSquare, href: "/categories/opinions", color: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400" },
  { name: "Sports", icon: Trophy, href: "/categories/sports", color: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" },
  { name: "Politics", icon: Vote, href: "/categories/politics", color: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
  { name: "Featured", icon: Star, href: "/categories/featured", color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400" },
];

export function CategoryGrid() {
  return (
    <section className="py-12 bg-white dark:bg-[#060D1A] transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8 border-l-4 border-upsa-gold pl-4">
          <h2 className="text-2xl font-bold text-upsa-navy dark:text-white uppercase tracking-tight">Explore Categories</h2>
          <Link href="/categories/all" className="text-sm font-semibold text-upsa-gold hover:underline">View All</Link>
        </div>
        
        <div className="flex overflow-x-auto pb-4 gap-3 md:gap-4 md:grid md:grid-cols-4 lg:grid-cols-7 snap-x px-1 -mx-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {categories.map((cat) => (
            <Link 
              key={cat.name} 
              href={cat.href}
              className="group flex flex-col items-center justify-center p-4 md:p-6 rounded-xl border border-gray-100 dark:border-white/10 hover:border-upsa-gold dark:hover:border-upsa-gold/40 hover:shadow-lg transition-all min-w-[100px] sm:min-w-[120px] md:min-w-0 snap-start bg-white dark:bg-[#0C1729] shrink-0"
            >
              <div className={`p-3 md:p-4 rounded-full mb-2 md:mb-4 group-hover:scale-110 transition-transform ${cat.color}`}>
                <cat.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <span className="font-bold text-upsa-navy dark:text-gray-200 text-xs md:text-sm group-hover:text-upsa-gold dark:group-hover:text-upsa-gold transition-colors">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
