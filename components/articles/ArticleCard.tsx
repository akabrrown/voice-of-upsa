import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Share2 } from "lucide-react";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  slug: string;
}

export function ArticleCard({ title, excerpt, category, date, readTime, image, slug }: ArticleCardProps) {
  return (
    <article className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
      <Link href={`/articles/${slug}`} className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <Badge className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold">
            {category}
          </Badge>
        </div>
      </Link>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center space-x-4 text-[10px] uppercase tracking-widest text-gray-400 mb-3 font-bold">
          <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {date}</span>
          <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {readTime}</span>
        </div>
        
        <Link href={`/articles/${slug}`}>
          <h3 className="text-xl font-bold text-upsa-navy mb-2 line-clamp-2 hover:text-upsa-gold transition-colors">
            {title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
          {excerpt}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <Link 
            href={`/articles/${slug}`} 
            className="text-sm font-bold text-upsa-navy hover:text-upsa-gold flex items-center transition-colors"
          >
            Read More
          </Link>
          <button className="text-gray-400 hover:text-upsa-gold transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
