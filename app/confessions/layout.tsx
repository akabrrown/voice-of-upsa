import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campus Confessions | Voice of UPSA",
  description: "Read anonymous student confessions, campus opinions, and uncensored stories from the University of Professional Studies, Accra community.",
  alternates: {
    canonical: "/confessions",
  },
  openGraph: {
    title: "Campus Confessions | Voice of UPSA",
    description: "Read anonymous student confessions, campus opinions, and uncensored stories from the University of Professional Studies, Accra community.",
    url: "/confessions",
    type: "website",
  },
};

export default function ConfessionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
