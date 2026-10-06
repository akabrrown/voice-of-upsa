import { Metadata } from "next";
import HandbookViewerWrapper from "./HandbookViewerWrapper";

export const metadata: Metadata = {
  title: "Undergraduate Students' Handbook | Voice of UPSA",
  description: "Official UPSA Undergraduate Students' Handbook. Access academic programs, rules, regulations, and resources.",
};

export default function HandbookPage() {
  return (
    <>
      <main className="bg-white min-h-screen pt-4 pb-12 flex-1">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="mb-6 md:mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-2 tracking-tight">
              Undergraduate Students' Handbook
            </h1>
            <p className="text-zinc-500 max-w-2xl text-[15px]">
              The official digital UPSA handbook. Use the toolbar to zoom, search, and navigate through the pages.
            </p>
          </div>
          
          <HandbookViewerWrapper />
        </div>
      </main>
    </>
  );
}
