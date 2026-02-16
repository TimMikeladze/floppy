import { Suspense } from "react";
import { HomePageClient } from "@/components/home-page-client";
import { csvImportFlag, releasesFlag } from "@/flags";

function LibraryLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex min-h-[60vh] items-center justify-center">
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
          <p className="text-sm text-muted-foreground font-medium">
            Loading library...
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function LibraryPage() {
  const csvImportEnabled = await csvImportFlag();
  const releasesEnabled = await releasesFlag();

  return (
    <Suspense fallback={<LibraryLoading />}>
      <HomePageClient
        csvImportEnabled={csvImportEnabled}
        releasesEnabled={releasesEnabled}
      />
    </Suspense>
  );
}
