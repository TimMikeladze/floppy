import type { Metadata } from "next";
import { LandingContent } from "@/components/landing-content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Floppy is the comic book app — read CBZ, CBR, PDF, and EPUB files offline in your browser. No sign-up, no cloud, just your comics.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return <LandingContent />;
}
