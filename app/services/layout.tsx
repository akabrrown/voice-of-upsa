import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gray-50/50 dark:bg-[#060D1A] transition-colors">
        {children}
      </main>
      <Footer />
    </>
  );
}
