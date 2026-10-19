import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Building, 
  MapPin, 
  Clock, 
  Banknote, 
  ArrowLeft,
  Calendar,
  ExternalLink,
  Mail,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

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

const MOCK_JOBS = [
  {
    id: "1",
    slug: "marketing-intern-tech-ghana",
    title: "Digital Marketing Intern",
    organization_name: "Tech Hub Ghana",
    type: "internship",
    location_type: "accra",
    location_label: "East Legon",
    compensation_type: "stipend",
    compensation_details: "GHS 500 monthly transport stipend",
    description: "We are looking for a creative student to join our marketing team for a 3-month internship. You will help manage our social media accounts and brainstorm new campaigns.",
    requirements: "- Active student at UPSA\n- Good understanding of TikTok and Instagram trends\n- Excellent written communication skills",
    apply_method: "link",
    apply_value: "https://example.com/apply",
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Admin Job Preview | Voice of UPSA`,
  };
}

export default async function AdminJobPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  
  let job = null;

  try {
      const { data, error } = await supabase
        .schema('jobs')
        .from('postings')
        .select('*, job_categories(name)')
        .eq('slug', slug)
        .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        job = MOCK_JOBS.find(j => j.slug === slug);
      } else {
        console.error("Supabase job fetch error:", error);
        throw error;
      }
    } else {
      job = data;
    }
  } catch (err) {
    console.error("Caught error in AdminJobPreviewPage:", err);
    job = MOCK_JOBS.find(j => j.slug === slug);
  }

  if (!job) {
    notFound();
  }

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto py-4">
        
        <Link href="/dashboard/admin/jobs" className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-slate-400 hover:text-[#1B2A4A] dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Admin Jobs
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-[#0C1729] rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 dark:border-white/10 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="h-20 w-20 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 flex items-center justify-center shrink-0">
              <Building className="h-10 w-10 text-gray-400 dark:text-slate-500" />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap gap-2 items-center mb-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-md tracking-wide ${typeColors[job.type] || 'bg-gray-100 dark:bg-white/10'}`}>
                  {typeLabels[job.type] || job.type}
                </span>
                
                {job.is_featured && (
                  <span className="text-xs font-bold px-3 py-1 rounded-md tracking-wide bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/40">
                    Featured
                  </span>
                )}
                
                {job.category && (
                  <span className="text-xs font-medium px-3 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-slate-300">
                    {job.category?.name || "Category"}
                  </span>
                )}

                {job.status && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-md tracking-wide border ${
                    job.status === 'approved' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/40' :
                    job.status === 'pending_review' ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/40' :
                    'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-slate-300 border-gray-200 dark:border-white/10'
                  }`}>
                    {job.status.replace('_', ' ').toUpperCase()}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-[#1B2A4A] dark:text-white tracking-tight mb-2">
                {job.title}
              </h1>
              <p className="text-xl text-gray-500 dark:text-slate-400 font-medium mb-6">
                {job.organization_name}
              </p>

              <div className="flex flex-wrap gap-y-3 gap-x-8 text-sm text-gray-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  <span className="capitalize font-medium">
                    {job.location_type.replace('_', ' ')} 
                    {job.location_label ? ` • ${job.location_label}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  <span className="capitalize font-medium">
                    {job.compensation_type}
                    {job.compensation_details ? ` • ${job.compensation_details}` : ''}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                  <span className="font-medium">
                    Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#0C1729] rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-white/10">
              {job.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={job.image_url} alt={`${job.title} at ${job.organization_name}`} className="w-full max-h-[28rem] object-contain rounded-2xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 mb-8" />
              )}
              <h2 className="text-xl font-bold text-[#1B2A4A] dark:text-white mb-4">Job Description</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none mb-8 whitespace-pre-wrap text-gray-600 dark:text-slate-300">
                {job.description}
              </div>

              <h2 className="text-xl font-bold text-[#1B2A4A] dark:text-white mb-4">Requirements</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none whitespace-pre-wrap text-gray-600 dark:text-slate-300">
                {job.requirements}
              </div>
            </div>
          </div>

          {/* Sidebar Action */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-[#0C1729] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 sticky top-24">
              
              {job.expires_at && (
                <div className="mb-6 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-[#C97C1C] dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Application Deadline</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {format(new Date(job.expires_at), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">How to Apply</h3>
                
                {job.apply_method === 'link' && (
                  <a href={job.apply_value} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <Button className="w-full bg-[#1F7A6C] hover:bg-[#155A4F] text-white rounded-xl py-6 text-lg font-bold shadow-md transition-all">
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Apply Externally
                    </Button>
                  </a>
                )}
                
                {job.apply_method === 'email' && (
                  <a href={`mailto:${job.apply_value}`} className="block w-full">
                    <Button className="w-full bg-[#1B2A4A] hover:bg-gray-900 dark:bg-upsa-gold dark:text-gray-950 dark:hover:bg-upsa-gold/90 text-white rounded-xl py-6 text-lg font-bold shadow-md transition-all">
                      <Mail className="h-5 w-5 mr-2" />
                      Email Application
                    </Button>
                  </a>
                )}

                {job.apply_method === 'instructions' && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl text-blue-900 dark:text-blue-300 text-sm whitespace-pre-wrap">
                    <div className="flex items-center gap-2 font-bold mb-2">
                      <Info className="h-4 w-4" /> Instructions
                    </div>
                    {job.apply_value}
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
