import { Metadata } from "next";
import { getAllCategoriesForAdmin } from "@/lib/services/queries";
import Link from "next/link";
import { ArrowLeft, Edit2 } from "lucide-react";
import { CategoryForm } from "@/components/services/CategoryForm";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Manage Categories | Admin",
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesForAdmin();

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <Link href="/dashboard/admin/services" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-upsa-navy mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
        <p className="text-sm text-gray-500 mt-1">Manage categories used to group campus services.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Category</h3>
            <CategoryForm />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Category Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Sort Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-6 py-4">
                      {cat.is_active ? (
                        <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 bg-gray-100 border-gray-200">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{cat.sort_order}</td>
                  </tr>
                ))}
                
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
