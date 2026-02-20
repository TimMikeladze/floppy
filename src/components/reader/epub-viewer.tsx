"use client";

import type Book from "epubjs/types/book";
import type Rendition from "epubjs/types/rendition";
import type { Location } from "epubjs/types/rendition";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReading } from "@/lib/reading-context";

// Lazy-load epubjs
let ePubModule: ((input: ArrayBuffer) => Book) | null = null;

async function getEpub(): Promise<(input: ArrayBuffer) => Book> {
  if (!ePubModule) {
    const mod = await import("epubjs");
    ePubModule = mod.default as unknown as (input: ArrayBuffer) => Book;
  }
  return ePubModule;
}

interface EpubViewerProps {
  file: Blob;
  initialCfi?: string;
  onLocationChange: (cfi: string, fraction: number, chapter?: string) => void;
  onReady?: (totalChapters: number) => void;
}

export function EpubViewer({
  file,
  initialCfi,
  onLocationChange,
  onReady,
}: EpubViewerProps) {
  const { settings } = useReading();
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track swipe gestures
  const swipeStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Determine flow mode from settings
  const flowMode =
    settings.layoutMode === "scrolling" ? "scrolled-doc" : "paginated";

  // Initialize book and rendition
  useEffect(() => {
    let cancelled = false;
    let book: Book | null = null;

    async function init() {
      if (!containerRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const ePub = await getEpub();
        const arrayBuffer = await file.arrayBuffer();
        if (cancelled) return;

        book = ePub(arrayBuffer);
        bookRef.current = book;

        const rendition = book.renderTo(containerRef.current, {
          flow: flowMode,
          width: "100%",
          height: "100%",
          allowScriptedContent: false,
        });

        renditionRef.current = rendition;

        // Apply theming
        applyTheme(rendition);

        // Listen for location changes
        rendition.on("relocated", (location: Location) => {
          if (cancelled) return;
          const cfi = location.start.cfi;
          const fraction = location.start.percentage;

          // Try to get chapter title from navigation
          let chapter: string | undefined;
          if (book?.navigation) {
            const spineItem = book.spine.get(location.start.href);
            if (spineItem) {
              const navItem = book.navigation.toc.find(
                (item) =>
                  item.href === location.start.href ||
                  item.href.split("#")[0] === location.start.href,
              );
              if (navItem) {
                chapter = navItem.label?.trim();
              }
            }
          }

          onLocationChange(cfi, fraction, chapter);
        });

        // Display at initial position or beginning
        if (initialCfi) {
          await rendition.display(initialCfi);
        } else {
          await rendition.display();
        }

        if (cancelled) return;

        // Report total chapters
        if (book.spine) {
          let count = 0;
          book.spine.each(() => {
            count++;
          });
          onReady?.(count);
        }

        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("[epub-viewer] Error loading EPUB:", err);
          setError(err instanceof Error ? err.message : "Failed to load EPUB");
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (renditionRef.current) {
        renditionRef.current.destroy();
        renditionRef.current = null;
      }
      if (bookRef.current) {
        bookRef.current.destroy();
        bookRef.current = null;
      }
    };
    // Only re-init when file or flow mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    file,
    flowMode, // Apply theming
    applyTheme,
    initialCfi,
    onLocationChange,
    onReady,
  ]);

  // Apply theme based on dark/light mode
  function applyTheme(rendition: Rendition) {
    const isDark = document.documentElement.classList.contains("dark");

    if (isDark) {
      rendition.themes.override("color", "#e4e4e7");
      rendition.themes.override("background", "#0d0d0d");
    } else {
      rendition.themes.override("color", "#1a1a1a");
      rendition.themes.override("background", "#ffffff");
    }

    // Typography defaults
    rendition.themes.default({
      body: {
        "font-family": "Georgia, 'Times New Roman', serif !important",
        "line-height": "1.6 !important",
        "font-size": "18px !important",
      },
      "p, div, span, li, td, th, blockquote, h1, h2, h3, h4, h5, h6": {
        "font-family": "inherit !important",
      },
      img: {
        "max-width": "100% !important",
        height: "auto !important",
      },
    });
  }

  // Watch for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (renditionRef.current) {
        applyTheme(renditionRef.current);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [applyTheme]);

  // Resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (renditionRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        renditionRef.current.resize(clientWidth, clientHeight);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Apply brightness
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.filter = `brightness(${settings.brightness}%)`;
    }
  }, [settings.brightness]);

  // Navigation functions
  const goNext = useCallback(() => {
    renditionRef.current?.next();
  }, []);

  const goPrev = useCallback(() => {
    renditionRef.current?.prev();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "ArrowRight" || e.key === "d") {
        settings.readingDirection === "ltr" ? goNext() : goPrev();
      } else if (e.key === "ArrowLeft" || e.key === "a") {
        settings.readingDirection === "ltr" ? goPrev() : goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, settings.readingDirection]);

  // Also bind keyboard events from within the epub iframe
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const handleKeyInIframe = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d") {
        settings.readingDirection === "ltr" ? goNext() : goPrev();
      } else if (e.key === "ArrowLeft" || e.key === "a") {
        settings.readingDirection === "ltr" ? goPrev() : goNext();
      }
    };

    rendition.on("keydown", handleKeyInIframe);
    return () => {
      rendition.off("keydown", handleKeyInIframe);
    };
  }, [goNext, goPrev, settings.readingDirection]);

  // Click zone navigation (left third / right third)
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (flowMode === "scrolled-doc") return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const zoneWidth = rect.width / 3;

      if (clickX < zoneWidth) {
        e.stopPropagation();
        settings.readingDirection === "ltr" ? goPrev() : goNext();
      } else if (clickX > zoneWidth * 2) {
        e.stopPropagation();
        settings.readingDirection === "ltr" ? goNext() : goPrev();
      }
    },
    [flowMode, goNext, goPrev, settings.readingDirection],
  );

  // Touch/swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!settings.swipeToTurnPages || flowMode === "scrolled-doc") return;
      if (swipeStartRef.current.time === 0) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStartRef.current.x;
      const deltaY = touch.clientY - swipeStartRef.current.y;
      const deltaTime = Date.now() - swipeStartRef.current.time;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      const MIN_SWIPE_DISTANCE = 50;
      const MIN_SWIPE_VELOCITY = 0.3;
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (
        distance >= MIN_SWIPE_DISTANCE &&
        velocity >= MIN_SWIPE_VELOCITY &&
        isHorizontal
      ) {
        if (settings.readingDirection === "ltr") {
          deltaX < 0 ? goNext() : goPrev();
        } else {
          deltaX > 0 ? goNext() : goPrev();
        }
      }

      swipeStartRef.current = { x: 0, y: 0, time: 0 };
    },
    [
      flowMode,
      goNext,
      goPrev,
      settings.readingDirection,
      settings.swipeToTurnPages,
    ],
  );

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center text-destructive">
          <p className="font-medium">Failed to load EPUB</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading EPUB...
            </p>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full w-full"
        onClick={handleContainerClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: flowMode === "scrolled-doc" ? "auto" : "none" }}
      />
    </div>
  );
}
