import { createClient } from "@/lib/supabase/server";
import JobsClient from "./JobsClient";

export const metadata = {
  title: "Job & Internship Board | Voice of UPSA",
  description: "Find career opportunities, internships, and gigs for UPSA students.",
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
    expires_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now (Closing Soon)
    is_featured: true
  },
  {
    id: "2",
    slug: "campus-ambassador-standard-chartered",
    title: "Campus Ambassador 2026",
    organization_name: "Standard Chartered Bank",
    type: "part_time",
    location_type: "on_campus",
    location_label: "UPSA Campus",
    compensation_type: "paid",
    expires_at: new Date(Date.now() + 86400000 * 10).toISOString(),
    is_featured: false
  },
  {
    id: "3",
    slug: "freelance-graphic-designer-src",
    title: "Freelance Graphic Designer",
    organization_name: "UPSA SRC",
    type: "freelance",
    location_type: "remote",
    location_label: "",
    compensation_type: "paid",
    expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
    is_featured: false
  }
];

export default async function JobsPage() {
  const supabase = await createClient();
  
  let jobs = [];

  try {
    const { data, error } = await supabase
      .schema('jobs')
      .from('postings')
      .select('*')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        // Table not found, migration probably not run yet. Use mock data.
        console.warn("Jobs table not found, using mock data. Please run the migration.");
        jobs = MOCK_JOBS;
      } else {
        throw error;
      }
    } else {
      jobs = data || [];
    }
  } catch (err) {
    console.error("Error fetching jobs:", err);
    jobs = MOCK_JOBS;
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <JobsClient initialJobs={jobs} />
    </main>
  );
}
