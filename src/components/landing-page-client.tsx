"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LandingContent } from "@/components/landing-content";
import { getAllComics } from "@/lib/storage";

export function LandingPageClient() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkReturningUser() {
      try {
        // Check if user has any comics in their library
        const comics = await getAllComics();

        // Also check localStorage for a visited flag
        const hasVisitedBefore =
          localStorage.getItem("floppy_has_visited") === "true";

        if (comics.length > 0 || hasVisitedBefore) {
          // User has used the app before, redirect to library
          router.replace("/library");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        // On error, show landing page
        console.error("Error checking returning user:", error);
        setIsChecking(false);
      }
    }

    checkReturningUser();
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto p-6 rounded-3xl mb-4 inline-block"
            style={{
              background:
                "linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)",
              boxShadow:
                "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border)",
            }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  function handleGetStarted() {
    // Mark as visited so they go directly to library next time
    localStorage.setItem("floppy_has_visited", "true");
    router.push("/library");
  }

  return <LandingContent onGetStarted={handleGetStarted} />;
}
