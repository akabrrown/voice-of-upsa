import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/providers/ToastProvider";
import PushNotificationProvider from "@/components/providers/PushNotificationProvider";
import { HolidayAmbientBar } from "@/components/holidays/HolidayAmbientBar";
import { HolidayGreetingModal } from "@/components/holidays/HolidayGreetingModal";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

import { getSiteUrl } from "@/lib/auth/urls";
import { getOptimizedOgImage } from "@/lib/utils/og-image";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const siteUrl = getSiteUrl();
const defaultOgImage = getOptimizedOgImage(null, "Voice of UPSA", siteUrl);

export const viewport: Viewport = {
  themeColor: "#0f172a", // UPSA Navy
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Voice of UPSA | Official Communications Hub",
    template: "%s | Voice of UPSA",
  },
  description: "The official digital news, student journalism, and campus communications platform for the University of Professional Studies, Accra (UPSA).",
  keywords: ["UPSA", "University of Professional Studies Accra", "Voice of UPSA", "Campus News", "Academic News", "Student Journalism", "Accra Ghana"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Voice of UPSA | Official Communications Hub",
    description: "The official digital news, student journalism, and campus communications platform for the University of Professional Studies, Accra (UPSA).",
    url: siteUrl,
    siteName: "Voice of UPSA",
    images: [
      {
        url: defaultOgImage.url,
        secureUrl: defaultOgImage.secureUrl,
        width: 1200,
        height: 630,
        alt: "Voice of UPSA",
        type: defaultOgImage.type,
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice of UPSA | Official Communications Hub",
    description: "The official digital news, student journalism, and campus communications platform for the University of Professional Studies, Accra (UPSA).",
    images: [defaultOgImage.url],
    site: "@voiceofupsa",
    creator: "@voiceofupsa",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: "Voice of UPSA",
  alternateName: ["VOU", "Voice of UPSA News"],
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/logo.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    "https://twitter.com/voiceofupsa",
    "https://facebook.com/voiceofupsa",
    "https://instagram.com/voiceofupsa",
    "https://linkedin.com/company/voiceofupsa",
    "https://youtube.com/@voiceofupsa",
  ],
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "University of Professional Studies, Accra",
    alternateName: "UPSA",
    url: "https://upsa.edu.gh",
  },
  publishingPrinciples: `${siteUrl}/guidelines`,
  masthead: `${siteUrl}/about`,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Editorial Desk",
    email: "contact@voiceofupsa.com",
    availableLanguage: ["en", "English"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Voice of UPSA",
  alternateName: "VOU",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground font-arial transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <ToastProvider />
          <PushNotificationProvider />
          <HolidayAmbientBar />
          <HolidayGreetingModal />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
