import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Voice of UPSA",
  description: "Get in touch with the Voice of UPSA editorial desk, report campus news tips, submit letters to the editor, or inquire about campus partnerships.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Voice of UPSA",
    description: "Get in touch with the Voice of UPSA editorial desk, report campus news tips, submit letters to the editor, or inquire about campus partnerships.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
