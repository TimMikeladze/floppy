import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { AppFooter } from "@/components/layout/app-footer";
import { OfflineBanner } from "@/components/offline-banner";
import { ThemeProvider } from "@/components/theme-provider";
import { ReadingProvider } from "@/lib/reading-context";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://floppy.sh"),
  title: {
    default: "Floppy — The Comic Book App",
    template: "%s | Floppy",
  },
  description:
    "The comic book app. Read CBZ, CBR, PDF, and EPUB comics in your browser. Offline-first, no account needed. Free and open-source.",
  generator: "Next.js",
  manifest: "/manifest.json",
  applicationName: "Floppy",
  keywords: [
    "comic book app",
    "comic book reader",
    "cbz reader",
    "cbr reader",
    "epub reader",
    "pdf reader",
    "pwa",
    "offline comic reader",
    "web comic reader",
  ],
  authors: [{ name: "Floppy", url: "https://floppy.sh" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://floppy.sh",
    siteName: "Floppy",
    title: "Floppy — The Comic Book App",
    description:
      "Read CBZ, CBR, PDF, and EPUB comics in your browser. Offline-first, no account needed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Floppy — The Comic Book App",
    description:
      "Read CBZ, CBR, PDF, and EPUB comics in your browser. Offline-first, no account needed.",
    creator: "@linesofcode",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Floppy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased overscroll-none min-h-screen flex flex-col overflow-x-hidden max-w-[100vw]">
        <OfflineBanner />
        <NuqsAdapter>
          <ThemeProvider>
            <ReadingProvider>
              <div className="flex-1 flex flex-col min-h-0">{children}</div>
              <AppFooter />
            </ReadingProvider>
          </ThemeProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "!bg-card !text-card-foreground !border-border",
            }}
          />
          <CommandPalette />
        </NuqsAdapter>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
