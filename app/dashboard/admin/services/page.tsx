import { Metadata } from "next";
import { getAllServicesForAdmin } from "@/lib/services/queries";
import Link from "next/link";
import { PlusCircle, Search, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ServiceAdminActions } from "./ServiceAdminActions";

export const metadata: Metadata = {
  title: "Manage Services | Admin",
};

export default async function AdminServicesPage() {
  const services = await getAllServicesForAdmin();

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Services</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage the directory of campus services and support offices.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/admin/services/categories"
            className="px-4 py-2 bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Categories
          </Link>
          <Link
            href="/dashboard/admin/services/new"
            className="flex items-center px-4 py-2 bg-upsa-navy text-white text-sm font-medium rounded-lg hover:bg-[#001f40] dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-upsa-gold/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Service
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0C1729] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Service Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Last Verified</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {service.logo_url ? (
                        <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mr-3 overflow-hidden shrink-0">
                          <img src={service.logo_url} alt={service.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 mr-3 flex items-center justify-center shrink-0">
                          <span className="text-gray-400 dark:text-slate-500 font-bold">{service.name.charAt(0)}</span>
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {service.name}
                          {service.is_featured && (
                            <Badge variant="secondary" className="text-[10px] bg-upsa-gold/20 text-upsa-navy dark:text-upsa-gold h-5 px-1.5">Featured</Badge>
                          )}
                        </div>
                        <div className="text-gray-500 dark:text-slate-400 text-xs mt-0.5 truncate max-w-[200px]">
                          {service.location_label || "No location set"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {service.category ? (
                      <Badge variant="outline" className="text-gray-600 dark:text-slate-300 dark:border-white/10 font-medium">
                        {service.category.name}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 dark:text-slate-500 text-xs">Uncategorized</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {service.status === 'active' ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-1 rounded-full border border-green-200 dark:border-green-800/40">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-gray-200 dark:border-white/10">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-gray-500 dark:text-slate-400">
                      <ShieldCheck className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                      {formatDistanceToNow(new Date(service.last_verified_at), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ServiceAdminActions service={service} />
                  </td>
                </tr>
              ))}
              
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                        <Search className="h-6 w-6 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">No services found</p>
                      <p className="text-sm mt-1">Get started by creating your first directory service.</p>
                      <Link
                        href="/dashboard/admin/services/new"
                        className="mt-4 px-4 py-2 bg-upsa-navy text-white text-sm font-medium rounded-lg hover:bg-[#001f40] dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-upsa-gold/90 transition-colors"
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
