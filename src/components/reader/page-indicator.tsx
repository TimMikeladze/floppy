"use client";

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  isVisible: boolean;
  chapterTitle?: string;
  fraction?: number;
}

export function PageIndicator({
  currentPage,
  totalPages,
  isVisible,
  chapterTitle,
  fraction,
}: PageIndicatorProps) {
  const isEpub = fraction !== undefined;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-black/70 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
        {isEpub ? (
          <>
            {chapterTitle && (
              <>
                <span className="max-w-48 truncate inline-block align-bottom">
                  {chapterTitle}
                </span>
                <span className="text-white/60 mx-1.5">&middot;</span>
              </>
            )}
            <span className="tabular-nums">{Math.round(fraction * 100)}%</span>
          </>
        ) : (
          <>
            <span className="tabular-nums">{currentPage + 1}</span>
            <span className="text-white/60 mx-1">/</span>
            <span className="tabular-nums text-white/60">{totalPages}</span>
          </>
        )}
      </div>
    </div>
  );
}
