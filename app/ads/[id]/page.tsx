import { notFound } from "next/navigation";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ExternalLink, Mail, Building, User as UserIcon, Phone } from "lucide-react";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

interface AdDetailsProps {
  params: {
    id: string;
  };
}

function isSafeUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url.trim());
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default async function AdDetailsPage({ params }: AdDetailsProps) {
  const resolvedParams = await params;
  
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  const supabaseAdmin = getAdminClient();
  const { data: ad, error } = await supabaseAdmin
    .from("advertisements")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !ad) {
    notFound();
  }

  // Prevent unauthorized access to non-active ads (protects advertiser contact PII)
  if (ad.status !== "active" && !isAdmin && ad.submitted_by !== user?.id) {
    notFound();
  }

  const safeTargetUrl = isSafeUrl(ad.target_url) ? ad.target_url.trim() : null;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 py-12 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {ad.creative_url && (
              <div className="w-full h-64 md:h-96 relative bg-gray-100">
                <Image 
                  src={ad.creative_url} 
                  alt={ad.product_name || ad.company_name} 
                  fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" 
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div className="p-8 md:p-12">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-upsa-gold/10 text-upsa-navy mb-6 uppercase tracking-wider">
                Sponsored / {ad.ad_type}
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-upsa-navy mb-6 leading-tight">
                {ad.product_name || ad.company_name}
              </h1>
              <p className="text-lg text-gray-600 mb-8 whitespace-pre-wrap">
                {ad.product_description || `Learn more about what ${ad.company_name} has to offer.`}
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Building className="h-5 w-5 mr-3 text-gray-400" />
                    <span className="font-medium">{ad.company_name}</span>
                  </div>
                  {ad.contact_name && (
                    <div className="flex items-center text-gray-600">
                      <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                      <span>{ad.contact_name}</span>
                    </div>
                  )}
                  {ad.contact_email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-5 w-5 mr-3 text-gray-400" />
                      <a href={`mailto:${ad.contact_email}`} className="hover:text-upsa-gold transition-colors">
                        {ad.contact_email}
                      </a>
                    </div>
                  )}
                  {ad.contact_phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-5 w-5 mr-3 text-gray-400" />
                      <a href={`tel:${ad.contact_phone}`} className="hover:text-upsa-gold transition-colors">
                        {ad.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {safeTargetUrl && (
                  <a 
                    href={safeTargetUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-upsa-navy hover:bg-upsa-gold hover:text-upsa-navy rounded-xl transition-all shadow-lg shadow-upsa-navy/20"
                  >
                    Visit Website <ExternalLink className="ml-2 h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
