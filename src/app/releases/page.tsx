import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { releasesFlag } from "@/flags";
import { ReleasesContent } from "./releases-content";

function ReleasesLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative animate-pulse"
        style={{
          background:
            "linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)",
          boxShadow:
            "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)",
        }}
      >
        <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold mb-3 text-foreground">
        Loading releases...
      </h2>
      <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
        Preparing your comic book collection
      </p>
    </div>
  );
}

export default async function ReleasesPage() {
  const releasesEnabled = await releasesFlag();

  if (!releasesEnabled) {
    redirect("/");
  }

  return (
    <Suspense fallback={<ReleasesLoadingFallback />}>
      <ReleasesContent releasesEnabled={releasesEnabled} />
    </Suspense>
  );
}
