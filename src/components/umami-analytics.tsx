"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    umami?: { track: (event?: string) => void };
  }
}

const VISITED_KEY = "floppy:visited";

export function UmamiAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const scriptUrl = process.env.NEXT_PUBLIC_UMAMI_URL;

  useEffect(() => {
    if (!websiteId || !scriptUrl) return;
    if (localStorage.getItem(VISITED_KEY)) return;

    setShouldLoad(true);
    localStorage.setItem(VISITED_KEY, "1");
  }, [websiteId, scriptUrl]);

  if (!shouldLoad) return null;

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      data-auto-track="false"
      strategy="afterInteractive"
      onLoad={() => {
        // Manually track only this page view (the landing page)
        if (typeof window !== "undefined" && window.umami) {
          window.umami.track();
        }
      }}
    />
  );
}
