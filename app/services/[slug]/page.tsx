import { Metadata } from "next";
import { getServiceBySlug } from "@/lib/services/queries";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Globe, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ShareServiceButton } from "@/components/services/ShareServiceButton";

interface ServicePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    return { title: "Service Not Found" };
  }

  const title = `${service.name} | Student Services Directory`;
  const description = service.description || `Contact information and operating hours for ${service.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: service.logo_url ? [service.logo_url] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: service.logo_url ? [service.logo_url] : [],
    }
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);

  if (!service) {
    notFound();
  }

  const verifiedAgo = formatDistanceToNow(new Date(service.last_verified_at), { addSuffix: true });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/services" className="inline-flex items-center text-sm font-medium text-upsa-navy hover:underline mb-8">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Directory
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-start gap-6">
          {service.logo_url ? (
            <div className="h-24 w-24 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
              <img src={service.logo_url} alt={service.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-24 w-24 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold text-gray-400">{service.name.charAt(0)}</span>
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2 justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{service.name}</h1>
                {service.is_featured && (
                  <Badge variant="secondary" className="bg-upsa-gold/20 text-upsa-navy hover:bg-upsa-gold/30">
                    Featured
                  </Badge>
                )}
              </div>
              <ShareServiceButton 
                title={`${service.name} | Voice of UPSA`}
                text={`Check out ${service.name} on the Voice of UPSA Student Services Directory.`}
              />
            </div>
            
            {service.category && (
              <Badge variant="outline" className="text-upsa-navy border-upsa-navy/20 mb-4">
                {service.category.name}
              </Badge>
            )}
            
            {service.description && (
              <p className="text-gray-600 text-lg leading-relaxed">
                {service.description}
              </p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          {/* Left Column: Contact & Location */}
          <div className="p-8 space-y-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Contact & Location</h3>
            
            {service.location_label && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-upsa-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-gray-600 mt-1">{service.location_label}</p>
                </div>
              </div>
            )}
            
            {service.contact_phone && (
              <div className="flex items-start">
                <Phone className="h-5 w-5 mr-3 text-upsa-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <a href={`tel:${service.contact_phone}`} className="text-upsa-navy hover:underline mt-1 block">
                    {service.contact_phone}
                  </a>
                </div>
              </div>
            )}
            
            {service.contact_email && (
              <div className="flex items-start">
                <Mail className="h-5 w-5 mr-3 text-upsa-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <a href={`mailto:${service.contact_email}`} className="text-upsa-navy hover:underline mt-1 block break-all">
                    {service.contact_email}
                  </a>
                </div>
              </div>
            )}
            
            {service.website_url && (
              <div className="flex items-start">
                <Globe className="h-5 w-5 mr-3 text-upsa-gold mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Website</p>
                  <a href={service.website_url} target="_blank" rel="noopener noreferrer" className="text-upsa-navy hover:underline mt-1 block break-all">
                    {service.website_url.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Hours & Verification */}
          <div className="p-8 space-y-6 bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Operating Hours</h3>
            
            {!service.hours ? (
              <div className="flex items-center text-gray-500">
                <Clock className="h-5 w-5 mr-3 text-gray-400" />
                <p>Hours not specified</p>
              </div>
            ) : typeof service.hours === 'string' ? (
              <div className="flex items-center text-gray-900">
                <Clock className="h-5 w-5 mr-3 text-upsa-gold" />
                <p>{service.hours}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(service.hours as Record<string, string>).map(([day, time]) => (
                  <div key={day} className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium capitalize">{day}</span>
                    <span className="text-gray-900">{time}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-start bg-green-50 p-4 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 mr-3 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-900">Verified Information</p>
                  <p className="text-sm text-green-800 mt-1">
                    This listing's details were last verified by an administrator {verifiedAgo}.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
