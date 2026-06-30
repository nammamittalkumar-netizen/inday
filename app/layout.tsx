import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";
import { ContentGuard } from "@/components/content-guard";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Inday — Everything that happened, in a day",
    template: "%s · Inday",
  },
  description:
    "Inday is a public feed where people share the small incidents of their day. Everything that happened — in a day. Post an incident, read others, like and comment.",
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Inday",
    description: "Share the incidents of your day.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-muted/30">
        <Providers>
          <ContentGuard />
          <Navbar />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-24 sm:pb-6">
            {children}
          </main>
          <footer className="border-t border-border py-6 pb-24 text-center text-sm text-muted-foreground sm:pb-6">
            Inday — everything that happened, in a day.
          </footer>
          <BottomNav />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
