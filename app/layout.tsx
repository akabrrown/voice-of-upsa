import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/providers/ToastProvider";
import OneSignalProvider from "@/components/providers/OneSignalProvider";
import { HolidayAmbientBar } from "@/components/holidays/HolidayAmbientBar";
import { HolidayGreetingModal } from "@/components/holidays/HolidayGreetingModal";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://voiceofupsa.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Voice of UPSA | Official Communications Hub",
    template: "%s | Voice of UPSA",
  },
  description: "The official digital news and communications platform for the University of Professional Studies, Accra (UPSA).",
  keywords: ["UPSA", "University of Professional Studies Accra", "Voice of UPSA", "Campus News", "Academic News"],
  openGraph: {
    title: "Voice of UPSA | Official Communications Hub",
    description: "The official digital news and communications platform for the University of Professional Studies, Accra (UPSA).",
    url: siteUrl,
    siteName: "Voice of UPSA",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Voice of UPSA",
      },
    ],
    locale: "en_GH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice of UPSA | Official Communications Hub",
    description: "The official digital news and communications platform for the University of Professional Studies, Accra (UPSA).",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "7f22b994-e03e-4e3f-b141-6ab398cbcdd0",
                  allowLocalhostAsSecureOrigin: true,
                });
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-arial" suppressHydrationWarning>
        <ToastProvider />
        <OneSignalProvider />
        <HolidayAmbientBar />
        <HolidayGreetingModal />
        {children}
      </body>
    </html>
  );
}
