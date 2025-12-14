import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./console-override"; // Production console override
import { Providers } from "@/components/Providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Font display strategy for better performance
  preload: true, // Preload critical font
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Not critical, don't preload
});

export const metadata: Metadata = {
  title: "BenAlsam - Türkiye'nin En Güvenilir Alım-Satım Platformu",
  description: "Binlerce ilan arasından ihtiyacınıza uygun olanı bulun. Emlak, araç, elektronik ve daha fazlası.",
  // Performance optimizations
  other: {
    "dns-prefetch": "https://api.benalsam.com",
    "preconnect": "https://api.benalsam.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <Providers>
            <Header />
            {children}
            <Footer />
            <Toaster />
            <ChatbotWidget />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
