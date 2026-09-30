import { Metadata } from "next";
import { getServiceCategories, getActiveServices } from "@/lib/services/queries";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Manage Services | Admin",
};

export default async function AdminServicesPage() {
  const [categories, services] = await Promise.all([
    getServiceCategories(),
    getActiveServices() // We would normally fetch ALL services for admin, including inactive ones
  ]);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the directory of campus services and support offices.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/services/categories"
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/dashboard/admin/services/new"
            className="flex items-center px-4 py-2 bg-upsa-navy text-white text-sm font-medium rounded-lg hover:bg-[#001f40] transition-colors"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Service
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Placeholder table for now, needs full implementation later */}
        <div className="p-8 text-center text-gray-500">
          <p>This is a placeholder for the Admin Service Directory table.</p>
          <p className="text-sm mt-2">The backend schema and Server Actions are ready. Run the SQL migration first before interacting with this page.</p>
        </div>
      </div>
    </div>
  );
}
