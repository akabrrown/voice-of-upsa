import { Metadata } from "next";
import { getServiceCategories, getActiveServices } from "@/lib/services/queries";
import { ServiceCard } from "@/components/services/ServiceCard";
import { CategoryChips } from "@/components/services/CategoryChips";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getServiceCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.name} | Student Services Directory`,
    description: `Find ${category.name} campus services at UPSA.`,
  };
}

export default async function ServicesCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  
  const [categories, allServices] = await Promise.all([
    getServiceCategories(),
    getActiveServices()
  ]);

  const category = categories.find((c) => c.slug === slug);
  
  if (!category) {
    notFound();
  }

  const categoryServices = allServices.filter(s => s.category?.slug === slug);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-upsa-navy mb-3">{category.name}</h1>
        <p className="text-gray-600 max-w-2xl">
          Browse all {category.name.toLowerCase()} campus services, contact information, and operating hours.
        </p>
      </div>

      <CategoryChips categories={categories} />

      <div>
        {categoryServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryServices.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No services found in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
