import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Image from "next/image";
import { Users, Target, ShieldCheck, Award, FileText, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AboutPage() {
  const supabase = await createClient();

  const [{ data: documents }, { data: teamMembers }] = await Promise.all([
    supabase
      .from("official_documents")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("editorial_team")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        {/* Hero Section */}
        <section className="relative py-20 bg-upsa-navy text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-upsa-gold/10 skew-x-12 translate-x-1/2" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">About Voice of UPSA</h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                The official digital gateway to news, events, and professional insights from the University of Professional Studies, Accra.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-block p-3 bg-upsa-gold/10 rounded-2xl mb-6">
                  <Target className="h-8 w-8 text-upsa-gold" />
                </div>
                <h2 className="text-3xl font-bold text-upsa-navy mb-6">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  To provide a credible, timely, and engaging platform that informs, educates, and connects the UPSA community, alumni, and stakeholders while upholding the highest standards of professional journalism.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3">
                    <ShieldCheck className="h-5 w-5 text-upsa-gold shrink-0 mt-1" />
                    <span className="text-sm font-bold text-upsa-navy">Credibility</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-upsa-gold shrink-0 mt-1" />
                    <span className="text-sm font-bold text-upsa-navy">Community</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-upsa-gold shrink-0 mt-1" />
                    <span className="text-sm font-bold text-upsa-navy">Excellence</span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1541339907198-e08759dfc3ef?q=80&w=1200"
                  alt="UPSA Campus"
                  fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Editorial Team */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-upsa-navy mb-4">The Editorial Team</h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-12 text-sm">
              The journalists, editors, and multimedia creators dedicated to delivering verified news and student perspectives across the UPSA campus.
            </p>

            {teamMembers && teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map((member: any) => (
                  <div key={member.id || member.name} className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 flex flex-col items-center">
                    <div className="relative w-24 h-24 mx-auto mb-5 rounded-full overflow-hidden border-2 border-upsa-gold shadow-sm bg-gray-50 shrink-0">
                      <Image 
                        src={member.image_url || "/logo.jpg"} 
                        alt={member.name} 
                        fill 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                        className="object-cover" 
                      />
                    </div>
                    <h3 className="text-base font-bold text-upsa-navy text-center">{member.name}</h3>
                    <p className="text-[11px] text-upsa-gold font-bold uppercase tracking-wider mt-1 text-center">{member.role}</p>
                    {member.bio && (
                      <p className="text-xs text-gray-500 mt-2.5 line-clamp-3 leading-relaxed text-center">
                        {member.bio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 max-w-md mx-auto border border-dashed border-gray-200">
                <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden border-2 border-upsa-gold shadow-sm">
                  <Image src="/logo.jpg" alt="Voice of UPSA" fill sizes="64px" className="object-cover" />
                </div>
                <h3 className="font-bold text-upsa-navy text-sm">Editorial Board</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Our newsroom roster is being updated by the university administration.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Documents & Reports */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mb-12">
              <h2 className="text-3xl font-bold text-upsa-navy mb-4">Documents & Reports</h2>
              <p className="text-gray-600 leading-relaxed">
                Access our annual reports and official documents to stay informed about our progress and activities.
              </p>
            </div>
            
            {documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc: any) => (
                  <a 
                    key={doc.id} 
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col p-6 border border-gray-100 rounded-2xl hover:border-upsa-gold/30 hover:shadow-xl transition-all duration-300 bg-gray-50/50 hover:bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white rounded-xl shadow-sm text-upsa-gold group-hover:bg-upsa-gold group-hover:text-white transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <Download className="h-5 w-5 text-gray-300 group-hover:text-upsa-navy transition-colors" />
                    </div>
                    <h3 className="font-bold text-upsa-navy mb-2 line-clamp-2">{doc.title}</h3>
                    {doc.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{doc.description}</p>
                    )}
                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider space-x-4 mt-auto pt-4 border-t border-gray-100">
                      <span>{doc.file_type}</span>
                      <span>•</span>
                      <span>{(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No official documents available at this time.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
