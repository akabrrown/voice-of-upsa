import { Metadata } from "next";
import { getServiceCategories, getActiveServices } from "@/lib/services/queries";
import { ServiceListClient } from "@/components/services/ServiceListClient";
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

  // Only display categories that actually have active services associated with them
  const activeCategories = categories.filter(category => 
    allServices.some(service => service.category_id === category.id)
  );

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

      <CategoryChips categories={activeCategories} />

      <ServiceListClient 
        services={otherServices as any} 
        featuredServices={featuredServices as any} 
      />
    </div>
  );
}
