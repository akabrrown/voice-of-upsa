import { Metadata } from "next";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getAllCategoriesForAdmin } from "@/lib/services/queries";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Add New Service | Admin",
};

export default async function NewServicePage() {
  const categories = await getAllCategoriesForAdmin();

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href="/dashboard/admin/services" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-upsa-navy mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Service</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new entry in the Student Services Directory.</p>
      </div>

      <ServiceForm categories={categories} />
    </div>
  );
}
