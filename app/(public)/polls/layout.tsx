import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 min-h-[calc(100vh-200px)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
