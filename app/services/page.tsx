import { Metadata } from "next";
import { getServiceCategories, getActiveServices } from "@/lib/services/queries";
import { ServiceCard } from "@/components/services/ServiceCard";
import { CategoryChips } from "@/components/services/CategoryChips";

export const metadata: Metadata = {
  title: "Student Services Directory",
  description: "Find critical campus services, contact information, and operating hours.",
};

export default async function ServicesDirectoryPage() {
  const [categories, allServices] = await Promise.all([
    getServiceCategories(),
    getActiveServices()
  ]);

  const featuredServices = allServices.filter(s => s.is_featured);
  const otherServices = allServices.filter(s => !s.is_featured);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-upsa-navy mb-3">Student Services Directory</h1>
        <p className="text-gray-600 max-w-2xl">
          Find critical campus services, contact information, and operating hours. 
          Information here is regularly verified for accuracy.
        </p>
      </div>

      <CategoryChips categories={categories} />

      {featuredServices.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="bg-upsa-gold/20 text-upsa-navy px-3 py-1 rounded text-sm mr-3">Featured</span>
            Key Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">All Services</h2>
        {otherServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No services found in the directory yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
