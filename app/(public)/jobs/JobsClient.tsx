"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow, isBefore, addDays } from "date-fns";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  Building,
  Banknote
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Color mappings as per Design Brief
const typeColors: Record<string, string> = {
  full_time: "bg-[#1F7A6C] text-white", // Campus Teal
  internship: "bg-[#1F7A6C] text-white", // Campus Teal
  part_time: "bg-[#1B2A4A] text-white", // Ink Navy
  volunteer: "bg-[#1B2A4A] text-white", // Ink Navy
  freelance: "bg-[#1B2A4A] text-white", // Ink Navy
};

const typeLabels: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  volunteer: "Volunteer",
  freelance: "Freelance/Gig",
};

export default function JobsClient({ initialJobs }: { initialJobs: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  
  // Filter logic
  const filteredJobs = initialJobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      job.organization_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#1B2A4A] tracking-tight mb-2">
            Job & Internship Board
          </h1>
          <p className="text-gray-500 text-lg">
            Discover career opportunities, internships, and campus gigs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/jobs/mine">
            <Button variant="outline" className="w-full sm:w-auto border-gray-200 text-[#1B2A4A] rounded-full px-6 shadow-sm transition-all hover:bg-gray-50">
              Manage My Postings
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button className="w-full sm:w-auto bg-[#1F7A6C] hover:bg-[#155A4F] text-white rounded-full px-6 shadow-md transition-all hover:shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Post Opportunity
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role or organization..."
            className="pl-10 bg-gray-50/50 border-gray-200 focus-visible:ring-[#1F7A6C] rounded-xl"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide shrink-0">
          <Button 
            variant={selectedType === "all" ? "default" : "outline"}
            onClick={() => setSelectedType("all")}
            className={`rounded-xl whitespace-nowrap ${selectedType === "all" ? "bg-[#1B2A4A] text-white" : ""}`}
          >
            All Types
          </Button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <Button 
              key={key}
              variant={selectedType === key ? "default" : "outline"}
              onClick={() => setSelectedType(key)}
              className={`rounded-xl whitespace-nowrap ${selectedType === key ? typeColors[key] : "text-gray-600"}`}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Listings */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#1B2A4A]">No opportunities found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isClosingSoon = job.expires_at && isBefore(new Date(job.expires_at), addDays(new Date(), 3));
            
            return (
              <Link key={job.id} href={`/jobs/${job.slug}`} className="block group">
                <div className={`bg-white rounded-2xl p-5 md:p-6 border transition-all duration-200 hover:shadow-lg ${job.is_featured ? 'border-[#1F7A6C]/30 bg-[#1F7A6C]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    
                    {/* Organization Logo Placeholder */}
                    <div className="h-16 w-16 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md tracking-wide ${typeColors[job.type] || 'bg-gray-100'}`}>
                          {typeLabels[job.type] || job.type}
                        </span>
                        
                        {isClosingSoon && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md tracking-wide bg-[#C97C1C] text-white flex items-center gap-1 animate-pulse">
                            <Clock className="h-3 w-3" />
                            Closing Soon
                          </span>
                        )}
                        
                        {job.is_featured && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-md tracking-wide bg-yellow-100 text-yellow-800 border border-yellow-200">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#1B2A4A] group-hover:text-[#1F7A6C] transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-gray-500 font-medium mb-4 flex items-center gap-1">
                        {job.organization_name}
                      </p>

                      <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">
                            {job.location_type.replace('_', ' ')} 
                            {job.location_label ? ` • ${job.location_label}` : ''}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <Banknote className="h-4 w-4 text-gray-400" />
                          <span className="capitalize">{job.compensation_type}</span>
                        </div>
                        
                        {job.expires_at && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>Closes {formatDistanceToNow(new Date(job.expires_at), { addSuffix: true })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center text-gray-400 group-hover:text-[#1F7A6C] transition-colors self-center">
                      <span className="text-sm font-semibold mr-1">Details</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
