import { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink, BookOpen, GraduationCap, Award, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import HandbookViewerWrapper from "./HandbookViewerWrapper";

export const metadata: Metadata = {
  title: "Undergraduate Students' Handbook | Voice of UPSA",
  description: "Official UPSA Undergraduate Students' Handbook. Access academic programs, rules, regulations, and resources.",
};

export default function HandbookPage() {
  const quickTopics = [
    {
      title: "Grading Scale & Classes",
      icon: Award,
      desc: "First Class (3.60-4.00), 2nd Upper (3.00-3.59), 2nd Lower (2.00-2.99), 3rd Class (1.50-1.99).",
    },
    {
      title: "Academic Integrity",
      icon: ShieldAlert,
      desc: "Code of conduct, plagiarism policies, examination ethics, and disciplinary board procedures.",
    },
    {
      title: "Course Registration",
      icon: BookOpen,
      desc: "Credit load requirements, add/drop periods, prerequisites, and deferment guidelines.",
    },
    {
      title: "Graduation Rules",
      icon: GraduationCap,
      desc: "Mandatory core requirements, cumulative GPA thresholds, and clearance procedures.",
    },
  ];

  return (
    <>
      <main className="bg-white dark:bg-[#060D1A] min-h-screen pt-4 pb-16 flex-1 transition-colors">
        <div className="container mx-auto px-4 max-w-[1400px]">
          {/* Header & Quick Action Bar */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-upsa-navy/5 dark:bg-white/10 text-upsa-navy dark:text-upsa-gold text-xs font-bold uppercase tracking-wider mb-3">
                <FileText className="w-3.5 h-3.5 text-upsa-gold" />
                University of Professional Studies, Accra
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-upsa-navy dark:text-white tracking-tight">
                Undergraduate Students' Handbook
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl text-sm md:text-base mt-2">
                Official institutional handbook covering academic regulations, grading systems, codes of conduct, and student privileges.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/students-handbook-2018.pdf"
                download="UPSA-Undergraduate-Students-Handbook.pdf"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-upsa-navy dark:bg-upsa-gold text-white dark:text-upsa-navy text-sm font-bold shadow-sm hover:bg-upsa-navy/90 dark:hover:bg-white hover:shadow transition-all"
              >
                <Download className="w-4 h-4 text-upsa-gold dark:text-upsa-navy" />
                <span>Download PDF</span>
              </a>
              <a
                href="/students-handbook-2018.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1729] text-gray-700 dark:text-gray-200 text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>Open in Tab</span>
              </a>
            </div>
          </div>

          {/* Quick Topics Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.title}
                  className="p-4 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-[#0C1729] hover:bg-white dark:hover:bg-[#0F1E36] hover:border-upsa-gold/30 dark:hover:border-upsa-gold/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-lg bg-upsa-navy/5 dark:bg-white/10 text-upsa-navy dark:text-upsa-gold">
                      <Icon className="w-4 h-4 text-upsa-gold" />
                    </div>
                    <h3 className="text-sm font-bold text-upsa-navy dark:text-white">{topic.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{topic.desc}</p>
                </div>
              );
            })}
          </div>

          {/* PDF Viewer */}
          <div className="bg-white dark:bg-[#0C1729] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 p-2 sm:p-4 transition-colors">
            <HandbookViewerWrapper />
          </div>

          {/* Academic Honors Reference */}
          <div className="mt-12 p-6 md:p-8 rounded-2xl bg-upsa-navy text-white relative overflow-hidden">
            <div className="relative z-10 max-w-4xl">
              <h2 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-upsa-gold" />
                UPSA Undergraduate Degree Classification System
              </h2>
              <p className="text-gray-300 text-xs md:text-sm mb-6 leading-relaxed">
                As stipulated in the regulations, the final cumulative Grade Point Average (FGPA) across all four academic levels determines the class of degree awarded upon graduation.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-upsa-gold font-bold uppercase tracking-wider">First Class</div>
                  <div className="text-lg font-black mt-1">3.60 – 4.00</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-upsa-gold font-bold uppercase tracking-wider">2nd Upper</div>
                  <div className="text-lg font-black mt-1">3.00 – 3.59</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-upsa-gold font-bold uppercase tracking-wider">2nd Lower</div>
                  <div className="text-lg font-black mt-1">2.00 – 2.99</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-upsa-gold font-bold uppercase tracking-wider">Third Class</div>
                  <div className="text-lg font-black mt-1">1.50 – 1.99</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-upsa-gold font-bold uppercase tracking-wider">Pass</div>
                  <div className="text-lg font-black mt-1">1.00 – 1.49</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-center">
                  <div className="text-xs text-red-300 font-bold uppercase tracking-wider">Fail</div>
                  <div className="text-lg font-black mt-1">&lt; 1.00</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
