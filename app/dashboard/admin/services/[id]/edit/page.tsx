import { Metadata } from "next";
import { ServiceForm } from "@/components/services/ServiceForm";
import { getAllCategoriesForAdmin } from "@/lib/services/queries";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Service | Admin",
};

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  const categories = await getAllCategoriesForAdmin();

  const supabase = await createClient();
  const { data: service } = await supabase
    .from("directory_services")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <Link href="/dashboard/admin/services" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-upsa-navy mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Service: {service.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Update the details of this service in the directory.</p>
      </div>

      <ServiceForm categories={categories} initialData={service} />
    </div>
  );
}
