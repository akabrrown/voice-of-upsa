import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
 }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        <Sidebar className="hidden lg:flex" />
        <MobileDashboardNav className="lg:hidden" />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
