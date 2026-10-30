import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrendNazar — Grow Your YouTube Channel with Trending Keywords",
  description:
    "Free YouTube keyword research — find trending keywords with search volume, competition, difficulty and CPC. Grow your YouTube channel faster with TrendNazar.",
  keywords: ["YouTube keywords", "keyword research", "YouTube SEO", "search volume", "trending topics", "content ideas"],
  icons: {
    icon: "/brand/icon-nazar-192.png",
  },
  openGraph: {
    title: "TrendNazar — Grow Your YouTube Channel with Trending Keywords",
    description: "Find trending YouTube keywords and grow your channel faster — free.",
    siteName: "TrendNazar",
    images: ["/brand/og-nazar.png"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
