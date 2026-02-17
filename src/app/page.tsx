import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing-page-client";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Floppy",
  description:
    "The comic book app. Read CBZ, CBR, PDF, and EPUB comics in your browser. Offline-first, no account needed.",
  url: "https://floppy.sh",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  browserRequirements: "Requires a modern web browser with JavaScript enabled",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        // Safe: jsonLd is a static constant defined at build time, not user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
