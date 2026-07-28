"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AttachFileDialog } from "@/components/library/attach-file-dialog";
import { ComicViewer } from "@/components/reader/comic-viewer";
import { EpubViewer } from "@/components/reader/epub-viewer";
import { NextIssueOverlay } from "@/components/reader/next-issue-overlay";
import { PageIndicator } from "@/components/reader/page-indicator";
import { PdfViewer } from "@/components/reader/pdf-viewer";
import { QuickNoteDialog } from "@/components/reader/quick-note-dialog";
import { ReaderMenu } from "@/components/reader/reader-menu";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { Button } from "@/components/ui/button";
import { SUPPORTED_FORMATS } from "@/lib/comic-parser";
import { useReading } from "@/lib/reading-context";
import { loadRemoteImage, revokeAllRemoteImages } from "@/lib/remote-loader";
import { findNextComic } from "@/lib/series-utils";
import {
  deleteComic,
  getAllComics,
  getBookmarks,
  getComic,
  getEpubFile,
  getFileFromHandle,
  getPagesForComic,
  getRemotePages,
  loadPagesFromHandle,
  saveBookmark,
  saveNote,
  updateEpubProgress,
  updateReadingProgress,
} from "@/lib/storage";
import type { Bookmark, Comic, RemotePage } from "@/lib/types";

/**
 * Resolve the comic id from the browser URL, falling back to the route params.
 *
 * When the service worker serves a cached reader document as an offline shell,
 * the params baked into that document belong to whichever comic happened to be
 * cached — not the one the user is opening. The pathname is always correct.
 *
 * Safe against hydration mismatches: the id is only read inside effects, never
 * rendered.
 */
function resolveComicId(fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }
  const match = window.location.pathname.match(/^\/reader\/([^/?#]+)/);
  if (!match?.[1]) {
    return fallback;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export default function ReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: routeId } = use(params);
  const { settings } = useReading();
  const [comic, setComic] = useState<Comic | null>(null);
  const [pageUrls, setPageUrls] = useState<string[]>([]);
  const [remotePageData, setRemotePageData] = useState<RemotePage[]>([]);
  const [usingCachedPages, setUsingCachedPages] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [nextIssue, setNextIssue] = useState<Comic | null>(null);
  const [nextIssueDismissed, setNextIssueDismissed] = useState(false);
  // Native PDF viewing state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [useNativePdf, setUseNativePdf] = useState(false);
  // EPUB reflowable viewer state
  const [epubFile, setEpubFile] = useState<Blob | null>(null);
  const [useEpubViewer, setUseEpubViewer] = useState(false);
  const [epubLocation, setEpubLocation] = useState<string | undefined>(
    undefined,
  );
  const [epubChapter, setEpubChapter] = useState<string | undefined>(undefined);
  const [readingFraction, setReadingFraction] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect
  useEffect(() => {
    loadComic();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts on desktop (screen width >= 768px)
      if (window.innerWidth < 768) return;

      // Toggle menu with 'M' or '?' key
      if (e.key === "m" || e.key === "M" || e.key === "?") {
        e.preventDefault();
        setMenuOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: functions are stable
  useEffect(() => {
    if (!comic) return;
    loadPages();
    loadBookmarks();
    loadNextIssue();
  }, [comic]);

  // Load the next comic (series-based or alphabetical fallback)
  async function loadNextIssue() {
    if (!comic) return;
    try {
      const allComics = await getAllComics();
      const next = findNextComic(comic, allComics);
      setNextIssue(next);
      setNextIssueDismissed(false); // Reset dismissal when comic changes
    } catch (error) {
      console.error("[reader] Error finding next comic:", error);
    }
  }

  useEffect(() => {
    if (!comic) return;
    const timer = setTimeout(() => {
      updateReadingProgress(comic.id, currentPage);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentPage, comic]);

  useEffect(() => {
    if (!controlsVisible || menuOpen) return;
    const timeout = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
    return () => clearTimeout(timeout);
  }, [controlsVisible, menuOpen]);

  // Load remote pages on demand (current page + adjacent for smooth navigation)
  useEffect(() => {
    // Skip if using cached pages (offline mode) or if no remote data available
    if (
      !comic ||
      comic.sourceType !== "remote" ||
      remotePageData.length === 0 ||
      usingCachedPages
    )
      return;

    const pagesToLoad = [currentPage - 1, currentPage, currentPage + 1].filter(
      (p) => p >= 0 && p < remotePageData.length,
    );

    async function loadRemotePages() {
      for (const pageIndex of pagesToLoad) {
        // Skip if already loaded
        if (pageUrls[pageIndex]) continue;

        const pageData = remotePageData[pageIndex];
        if (!pageData) continue;

        try {
          const blobUrl = await loadRemoteImage(pageData.imageUrl);
          setPageUrls((prev) => {
            const updated = [...prev];
            updated[pageIndex] = blobUrl;
            return updated;
          });
        } catch (error) {
          console.error(
            `[reader] Failed to load remote page ${pageIndex}:`,
            error,
          );
        }
      }
    }

    loadRemotePages();
  }, [currentPage, comic, remotePageData, pageUrls, usingCachedPages]);

  // Cleanup remote image URLs on unmount
  useEffect(() => {
    return () => {
      if (comic?.sourceType === "remote") {
        revokeAllRemoteImages();
      }
    };
  }, [comic?.sourceType]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      if (!isNowFullscreen) {
        setControlsVisible(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("[reader] Fullscreen error:", error);
      toast.error("Fullscreen not supported");
    }
  }, []);

  // Keyboard shortcuts (F for fullscreen, M/Escape for menu, Space for controls)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "m" || e.key === "M") {
        // Toggle menu with M key
        setMenuOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        // Close menu if open, otherwise exit reader
        if (menuOpen) {
          setMenuOpen(false);
        } else {
          router.push("/library");
        }
      } else if (e.key === " ") {
        // Space bar toggles controls (prevent scroll)
        e.preventDefault();
        setControlsVisible((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, router, toggleFullscreen]);

  const toggleControls = useCallback(() => {
    // Toggle controls on center click in both normal and fullscreen modes
    setControlsVisible((prev) => !prev);
  }, []);

  async function loadComic() {
    try {
      const loadedComic = await getComic(resolveComicId(routeId));
      if (!loadedComic) {
        toast.error("Comic not found", {
          description: "This comic could not be loaded",
        });
        router.push("/library");
        return;
      }
      setComic(loadedComic);
      setCurrentPage(loadedComic.currentPage);
    } catch (error) {
      console.error("[reader] Error loading comic:", error);
      toast.error("Failed to load comic");
      router.push("/library");
    }
  }

  async function loadPages() {
    if (!comic) return;

    // Handle remote comics
    if (comic.sourceType === "remote") {
      try {
        // First, check for cached pages (offline support)
        const cachedPages = await getPagesForComic(comic.id);
        if (cachedPages && cachedPages.length > 0) {
          // Use cached pages - comic is available offline
          const urls = cachedPages.map((blob) => URL.createObjectURL(blob));
          setPageUrls(urls);
          setUsingCachedPages(true);
          setIsLoading(false);
          return;
        }

        // No cached pages, fall back to loading from remote URLs
        const remotePagesRecord = await getRemotePages(comic.id);
        if (remotePagesRecord && remotePagesRecord.pages.length > 0) {
          // Sort pages by page number
          const sortedPages = [...remotePagesRecord.pages].sort(
            (a, b) => a.pageNumber - b.pageNumber,
          );
          setRemotePageData(sortedPages);
          // Initialize pageUrls with placeholders (will be loaded on demand)
          setPageUrls(sortedPages.map(() => ""));
        }
      } catch (error) {
        console.error("[reader] Error loading remote pages:", error);
        toast.error("Failed to load comic pages");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle local comics
    if (!comic.hasFile || !comic.totalPages) {
      setIsLoading(false);
      return;
    }

    try {
      // EPUB reflowable viewer: load the raw EPUB file for epubjs
      if (comic.format === "epub") {
        let blob: Blob | null = null;

        // Try file handle first (desktop, avoids IndexedDB storage)
        if (comic.fileHandle) {
          try {
            const f = await getFileFromHandle(comic.fileHandle);
            if (f) blob = f;
          } catch {
            // fall through to IndexedDB
          }
        }

        // Fall back to stored epub file
        if (!blob) {
          blob = await getEpubFile(comic.id);
        }

        if (blob) {
          setEpubFile(blob);
          setUseEpubViewer(true);
          setEpubLocation(comic.epubCfi || undefined);
          setIsLoading(false);
          return;
        }

        // No EPUB file found — fall through to legacy rasterized pages
      }

      let pages: Blob[] | null = null;

      // For PDFs with a file handle, try native PDF viewing first
      // This provides better quality rendering and zoom
      if (comic.format === "pdf" && comic.fileHandle) {
        try {
          const file = await getFileFromHandle(comic.fileHandle);
          if (file) {
            setPdfFile(file);
            setUseNativePdf(true);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.warn(
            "[reader] Failed to get PDF file from handle, falling back to pre-rendered pages:",
            error,
          );
        }
      }

      // For PDFs without file handle, use pre-rendered pages from IndexedDB
      if (comic.format === "pdf") {
        pages = await getPagesForComic(comic.id);
      }

      // Try file handle for non-PDF formats (desktop Chrome/Edge)
      if (!pages && comic.fileHandle && comic.format) {
        const result = await loadPagesFromHandle(
          comic.fileHandle,
          comic.format,
        );
        if (result) {
          pages = result.pages;
        }
      }

      // Fall back to IndexedDB storage (iOS/Safari or if handle failed)
      if (!pages) {
        pages = await getPagesForComic(comic.id);
      }

      if (pages && pages.length > 0) {
        const urls = pages.map((blob) => URL.createObjectURL(blob));
        setPageUrls(urls);
      }
    } catch (error) {
      console.error("[reader] Error loading pages:", error);
      toast.error("Failed to load comic pages");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBookmarks() {
    if (!comic) return;
    try {
      const loaded = await getBookmarks(comic.id);
      setBookmarks(loaded);
    } catch (error) {
      console.error("[reader] Error loading bookmarks:", error);
    }
  }

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleTotalPagesChange = useCallback(
    (total: number) => {
      // Update comic total pages if needed (for native PDF viewing)
      if (comic && comic.totalPages !== total) {
        setComic({ ...comic, totalPages: total });
      }
    },
    [comic],
  );

  // EPUB location change handler with debounced progress save
  const epubProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const handleEpubLocationChange = useCallback(
    (cfi: string, fraction: number, chapter?: string) => {
      setReadingFraction(fraction);
      setEpubChapter(chapter);

      // Debounce progress save
      if (epubProgressTimerRef.current) {
        clearTimeout(epubProgressTimerRef.current);
      }
      epubProgressTimerRef.current = setTimeout(() => {
        if (comic) {
          const approxPage = Math.floor(fraction * (comic.totalPages || 1));
          updateEpubProgress(comic.id, cfi, approxPage);
        }
      }, 1000);
    },
    [comic],
  );

  // Cleanup epub progress timer
  useEffect(() => {
    return () => {
      if (epubProgressTimerRef.current) {
        clearTimeout(epubProgressTimerRef.current);
      }
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadBookmarks is stable
  const handleBookmark = useCallback(async () => {
    if (!comic) return;
    try {
      const bookmarkId = crypto.randomUUID();
      await saveBookmark({
        id: bookmarkId,
        comicId: comic.id,
        pageNumber: currentPage,
        createdAt: new Date(),
        thumbnailUrl: pageUrls[currentPage],
      });
      await loadBookmarks();
      toast.success(`Page ${currentPage + 1} bookmarked`);
    } catch (error) {
      console.error("[reader] Error saving bookmark:", error);
      toast.error("Failed to save bookmark");
    }
  }, [comic, currentPage, pageUrls]);

  const handleQuickNote = useCallback(() => {
    setNoteDialogOpen(true);
  }, []);

  const handleSaveNote = useCallback(
    async (content: string) => {
      if (!comic) return;

      try {
        await saveNote({
          id: crypto.randomUUID(),
          comicId: comic.id,
          pageNumber: currentPage,
          content,
          createdAt: new Date(),
          updatedAt: new Date(),
          color: "#e85d4d",
        });
        toast.success(`Note added to page ${currentPage + 1}`);
      } catch (error) {
        console.error("[reader] Error saving note:", error);
        toast.error("Failed to save note");
      }
    },
    [comic, currentPage],
  );

  const handleDelete = useCallback(async () => {
    if (!comic) return;
    try {
      await deleteComic(comic.id);
      toast.success("Comic deleted");
      router.push("/library");
    } catch (error) {
      console.error("[reader] Error deleting comic:", error);
      toast.error("Failed to delete comic");
    }
  }, [comic, router]);

  // Handler to show controls when mouse is near top edge in fullscreen
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isFullscreen) return;

      // Show toolbar when mouse is in top 60px
      if (e.clientY <= 60) {
        setControlsVisible(true);
      } else if (controlsVisible && e.clientY > 120) {
        // Hide when mouse moves away from top area
        setControlsVisible(false);
      }
    },
    [isFullscreen, controlsVisible],
  );

  const isCurrentPageBookmarked = bookmarks.some(
    (b) => b.pageNumber === currentPage,
  );

  if (isLoading || !comic) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading comic...</p>
        </div>
      </div>
    );
  }

  // Remote comics have pages loaded from URLs, not files
  const isRemote = comic.sourceType === "remote";
  const hasContent = isRemote
    ? remotePageData.length > 0 || usingCachedPages
    : useEpubViewer
      ? epubFile !== null
      : useNativePdf
        ? pdfFile !== null
        : comic.hasFile && comic.totalPages;

  if (!hasContent) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <div className="rounded-full bg-muted p-6 mx-auto w-fit">
            <Upload className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-foreground">
            {comic.title}
          </h2>
          {comic.series && (
            <p className="mt-2 text-muted-foreground">
              {comic.series}
              {comic.issue && ` #${comic.issue}`}
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {isRemote
              ? "This comic's pages could not be loaded."
              : `This comic doesn't have a file attached yet. Upload a ${SUPPORTED_FORMATS.description} file to start reading.`}
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/library")}>
              Back to Library
            </Button>
            {!isRemote && (
              <Button
                onClick={() => setAttachDialogOpen(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Attach File
              </Button>
            )}
          </div>
        </div>
        {!isRemote && (
          <AttachFileDialog
            comicId={comic.id}
            open={attachDialogOpen}
            onOpenChange={setAttachDialogOpen}
            onFileAttached={() => {
              loadComic();
            }}
          />
        )}
      </div>
    );
  }

  const totalPages = isRemote
    ? usingCachedPages
      ? pageUrls.length
      : remotePageData.length
    : (comic.totalPages ?? 0);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      <ReaderToolbar
        title={comic.title}
        currentPage={currentPage}
        totalPages={totalPages}
        isVisible={controlsVisible}
        onMenuClick={() => setMenuOpen(true)}
        onBookmarkClick={handleBookmark}
        onNoteClick={handleQuickNote}
        isBookmarked={isCurrentPageBookmarked}
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
      />

      <main className="h-full w-full" onClick={toggleControls}>
        {useEpubViewer && epubFile ? (
          <EpubViewer
            file={epubFile}
            initialCfi={epubLocation}
            onLocationChange={handleEpubLocationChange}
            onReady={handleTotalPagesChange}
          />
        ) : useNativePdf && pdfFile ? (
          <PdfViewer
            file={pdfFile}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onTotalPagesChange={handleTotalPagesChange}
          />
        ) : (
          <ComicViewer
            pages={pageUrls}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        )}
      </main>

      <PageIndicator
        currentPage={currentPage}
        totalPages={totalPages}
        isVisible={
          !controlsVisible &&
          !menuOpen &&
          !isFullscreen &&
          (settings.showPageNumbers ?? false) &&
          settings.layoutMode !== "scrolling"
        }
        chapterTitle={useEpubViewer ? epubChapter : undefined}
        fraction={useEpubViewer ? readingFraction : undefined}
      />

      <ReaderMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onBookmarkClick={handleBookmark}
        comic={comic}
        pages={pageUrls}
        bookmarks={bookmarks}
        onRefreshBookmarks={loadBookmarks}
        onDelete={handleDelete}
        onComicUpdate={loadComic}
        readingFraction={useEpubViewer ? readingFraction : undefined}
      />

      <QuickNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        currentPage={currentPage}
        onSave={handleSaveNote}
      />

      {/* Next issue overlay - shown when on last page */}
      {nextIssue && (
        <NextIssueOverlay
          currentComic={comic}
          nextIssue={nextIssue}
          isVisible={
            currentPage === totalPages - 1 && !nextIssueDismissed && !menuOpen
          }
          onDismiss={() => setNextIssueDismissed(true)}
        />
      )}
    </div>
  );
}
