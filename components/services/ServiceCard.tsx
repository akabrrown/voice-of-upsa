import Link from "next/link";
import { MapPin, Clock, Phone, ExternalLink, ShieldCheck, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { StudentService } from "@/lib/types/services";

interface ServiceCardProps {
  service: StudentService;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const verifiedAgo = formatDistanceToNow(new Date(service.last_verified_at), { addSuffix: true });
  
  return (
    <Card className="group overflow-hidden hover:border-upsa-navy transition-all duration-300">
      <Link href={`/services/${service.slug}`} className="block h-full">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              {service.logo_url ? (
                <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                  <img src={service.logo_url} alt={service.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-gray-400">{service.name.charAt(0)}</span>
                </div>
              )}
              {service.is_featured && (
                <Badge variant="secondary" className="bg-upsa-gold/10 text-upsa-navy border-upsa-gold/20">
                  Featured
                </Badge>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-upsa-navy mb-2 line-clamp-1">{service.name}</h3>
            
            {service.category && (
              <div className="mb-3">
                <span className="text-xs font-medium text-upsa-navy bg-upsa-navy/5 px-2 py-1 rounded">
                  {service.category.name}
                </span>
              </div>
            )}
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
              {service.description}
            </p>
            
            <div className="space-y-2 mt-auto pt-4 border-t border-gray-100">
              {service.location_label && (
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span className="truncate">{service.location_label}</span>
                </div>
              )}
              {service.contact_phone && (
                <div className="flex items-center text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5 mr-2 shrink-0" />
                  <span className="truncate">{service.contact_phone}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 text-xs text-gray-500 flex items-center justify-between border-t border-gray-100">
            <div className="flex items-center text-green-600">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              <span>Verified {verifiedAgo}</span>
            </div>
            <div className="text-upsa-navy font-medium group-hover:underline flex items-center">
              View details <ExternalLink className="h-3 w-3 ml-1" />
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
