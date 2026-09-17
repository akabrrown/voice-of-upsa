import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/providers/ToastProvider";
import OneSignalProvider from "@/components/providers/OneSignalProvider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Voice of UPSA | Official Communications Hub",
  description: "The official digital news and communications platform for the University of Professional Studies, Accra (UPSA).",
  keywords: ["UPSA", "University of Professional Studies Accra", "Voice of UPSA", "Campus News", "Academic News"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-arial" suppressHydrationWarning>
        <ToastProvider />
        <OneSignalProvider />
        {children}
      </body>
    </html>
  );
}
