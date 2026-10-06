"use client";

import { useState } from "react";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Search } from "lucide-react";

type Service = any & {
  category?: { name: string; slug: string };
};

interface ServiceListClientProps {
  services: Service[];
  featuredServices?: Service[];
}

export function ServiceListClient({ services, featuredServices = [] }: ServiceListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filterServices = (list: Service[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.description && s.description.toLowerCase().includes(query)) ||
      (s.location_label && s.location_label.toLowerCase().includes(query))
    );
  };

  const filteredFeatured = filterServices(featuredServices);
  const filteredOther = filterServices(services);
  
  const hasAnyResults = filteredFeatured.length > 0 || filteredOther.length > 0;

  return (
    <div>
      <div className="relative mb-8 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search services, locations, keywords..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-upsa-navy focus:border-upsa-navy sm:text-sm transition-shadow shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {!hasAnyResults ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No services match your search "{searchQuery}".</p>
        </div>
      ) : (
        <>
          {featuredServices.length > 0 && filteredFeatured.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="bg-upsa-gold/20 text-upsa-navy px-3 py-1 rounded text-sm mr-3">Featured</span>
                Key Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeatured.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}

          {filteredOther.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">{featuredServices.length > 0 ? "All Services" : ""}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOther.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
