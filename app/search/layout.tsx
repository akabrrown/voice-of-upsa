import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search News & Archives | Voice of UPSA",
  description: "Search publications, student stories, university announcements, and multimedia archives across Voice of UPSA.",
  alternates: {
    canonical: "/search",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
