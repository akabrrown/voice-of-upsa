import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Podcasts & Campus Audio | Voice of UPSA",
  description: "Tune into official Voice of UPSA podcasts featuring campus talk shows, student leadership interviews, and academic lifestyle audio.",
  alternates: {
    canonical: "/podcasts",
  },
  openGraph: {
    title: "Podcasts & Campus Audio | Voice of UPSA",
    description: "Tune into official Voice of UPSA podcasts featuring campus talk shows, student leadership interviews, and academic lifestyle audio.",
    url: "/podcasts",
    type: "website",
  },
};

export default function PodcastsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
