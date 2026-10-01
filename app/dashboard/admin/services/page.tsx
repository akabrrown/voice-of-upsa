import { Metadata } from "next";
import { getAllServicesForAdmin } from "@/lib/services/queries";
import Link from "next/link";
import { PlusCircle, Search, Edit2, ShieldCheck, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Manage Services | Admin",
};

export default async function AdminServicesPage() {
  const services = await getAllServicesForAdmin();

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Service Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Verified</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {service.logo_url ? (
                        <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200 mr-3 overflow-hidden shrink-0">
                          <img src={service.logo_url} alt={service.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200 mr-3 flex items-center justify-center shrink-0">
                          <span className="text-gray-400 font-bold">{service.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {service.name}
                          {service.is_featured && (
                            <Badge variant="secondary" className="text-[10px] bg-upsa-gold/20 text-upsa-navy h-5 px-1.5">Featured</Badge>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">
                          {service.location_label || "No location set"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {service.category ? (
                      <Badge variant="outline" className="text-gray-600 font-medium">
                        {service.category.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">Uncategorized</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {service.status === 'active' ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-500">
                      <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                      {formatDistanceToNow(new Date(service.last_verified_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8 border-gray-200 text-gray-700 hover:text-upsa-navy hover:bg-gray-50">
                        <Link href={`/dashboard/admin/services/${service.id}/edit`}>
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-900">No services found</p>
                      <p className="text-sm mt-1">Get started by creating your first directory service.</p>
                      <Link
                        href="/dashboard/admin/services/new"
                        className="mt-4 px-4 py-2 bg-upsa-navy text-white text-sm font-medium rounded-lg hover:bg-[#001f40] transition-colors"
                      >
                        Add Service
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
