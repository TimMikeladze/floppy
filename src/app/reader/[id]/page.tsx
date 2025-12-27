"use client"

import React, { useState, useEffect, useCallback, use, useRef } from "react"
import { ComicViewer } from "@/components/reader/comic-viewer"
import { ReaderToolbar } from "@/components/reader/reader-toolbar"
import { ReaderMenu } from "@/components/reader/reader-menu"
import { PageIndicator } from "@/components/reader/page-indicator"
import { QuickNoteDialog } from "@/components/reader/quick-note-dialog"
import { getComic, updateReadingProgress, saveBookmark, getBookmarks, saveNote, loadPagesFromHandle, getPagesForComic, getRemotePages } from "@/lib/storage"
import { SUPPORTED_FORMATS } from "@/lib/comic-parser"
import { loadRemoteImage, revokeAllRemoteImages } from "@/lib/remote-loader"
import type { Comic, Bookmark, RemotePage } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Settings2 } from "lucide-react"
import { AttachFileDialog } from "@/components/library/attach-file-dialog"
import { useReading } from "@/lib/reading-context"

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { settings } = useReading()
  const [comic, setComic] = useState<Comic | null>(null)
  const [pageUrls, setPageUrls] = useState<string[]>([])
  const [remotePageData, setRemotePageData] = useState<RemotePage[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadComic()
  }, [id])

  useEffect(() => {
    if (!comic) return
    loadPages()
    loadBookmarks()
  }, [comic])

  useEffect(() => {
    if (!comic) return
    const timer = setTimeout(() => {
      updateReadingProgress(comic.id, currentPage)
    }, 1000)
    return () => clearTimeout(timer)
  }, [currentPage, comic])

  useEffect(() => {
    if (!controlsVisible || menuOpen) return
    const timeout = setTimeout(() => {
      setControlsVisible(false)
    }, 4000)
    return () => clearTimeout(timeout)
  }, [controlsVisible, menuOpen])

  // Load remote pages on demand (current page + adjacent for smooth navigation)
  useEffect(() => {
    if (!comic || comic.sourceType !== 'remote' || remotePageData.length === 0) return

    const pagesToLoad = [
      currentPage - 1,
      currentPage,
      currentPage + 1,
    ].filter(p => p >= 0 && p < remotePageData.length)

    async function loadRemotePages() {
      for (const pageIndex of pagesToLoad) {
        // Skip if already loaded
        if (pageUrls[pageIndex]) continue

        const pageData = remotePageData[pageIndex]
        if (!pageData) continue

        try {
          const blobUrl = await loadRemoteImage(pageData.imageUrl)
          setPageUrls(prev => {
            const updated = [...prev]
            updated[pageIndex] = blobUrl
            return updated
          })
        } catch (error) {
          console.error(`[reader] Failed to load remote page ${pageIndex}:`, error)
        }
      }
    }

    loadRemotePages()
  }, [currentPage, comic, remotePageData])

  // Cleanup remote image URLs on unmount
  useEffect(() => {
    return () => {
      if (comic?.sourceType === 'remote') {
        revokeAllRemoteImages()
      }
    }
  }, [comic?.sourceType])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)
      if (!isNowFullscreen) {
        setControlsVisible(false)
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Keyboard shortcuts (F for fullscreen, M/Escape for menu, Space for controls)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === "f" || e.key === "F") {
        toggleFullscreen()
      } else if (e.key === "m" || e.key === "M") {
        // Toggle menu with M key
        setMenuOpen(prev => !prev)
      } else if (e.key === "Escape") {
        // Close menu if open, otherwise toggle controls
        if (menuOpen) {
          setMenuOpen(false)
        } else {
          setControlsVisible(prev => !prev)
        }
      } else if (e.key === " ") {
        // Space bar toggles controls (prevent scroll)
        e.preventDefault()
        setControlsVisible(prev => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [menuOpen])

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("[reader] Fullscreen error:", error)
      toast.error("Fullscreen not supported")
    }
  }, [])

  const toggleControls = useCallback(() => {
    // Toggle controls on center click in both normal and fullscreen modes
    setControlsVisible((prev) => !prev)
  }, [])

  async function loadComic() {
    try {
      const loadedComic = await getComic(id)
      if (!loadedComic) {
        toast.error("Comic not found", {
          description: "This comic could not be loaded",
        })
        router.push("/")
        return
      }
      setComic(loadedComic)
      setCurrentPage(loadedComic.currentPage)
    } catch (error) {
      console.error("[reader] Error loading comic:", error)
      toast.error("Failed to load comic")
      router.push("/")
    }
  }

  async function loadPages() {
    if (!comic) return

    // Handle remote comics
    if (comic.sourceType === 'remote') {
      try {
        const remotePagesRecord = await getRemotePages(comic.id)
        if (remotePagesRecord && remotePagesRecord.pages.length > 0) {
          // Sort pages by page number
          const sortedPages = [...remotePagesRecord.pages].sort((a, b) => a.pageNumber - b.pageNumber)
          setRemotePageData(sortedPages)
          // Initialize pageUrls with placeholders (will be loaded on demand)
          setPageUrls(sortedPages.map(() => ''))
        }
      } catch (error) {
        console.error("[reader] Error loading remote pages:", error)
        toast.error("Failed to load comic pages")
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Handle local comics
    if (!comic.hasFile || !comic.totalPages) {
      setIsLoading(false)
      return
    }

    try {
      let pages: Blob[] | null = null

      // Try file handle first (desktop Chrome/Edge)
      if (comic.fileHandle && comic.format) {
        const result = await loadPagesFromHandle(comic.fileHandle, comic.format)
        if (result) {
          pages = result.pages
        }
      }

      // Fall back to IndexedDB storage (iOS/Safari)
      if (!pages) {
        pages = await getPagesForComic(comic.id)
      }

      if (pages && pages.length > 0) {
        const urls = pages.map((blob) => URL.createObjectURL(blob))
        setPageUrls(urls)
      }
    } catch (error) {
      console.error("[reader] Error loading pages:", error)
      toast.error("Failed to load comic pages")
    } finally {
      setIsLoading(false)
    }
  }

  async function loadBookmarks() {
    if (!comic) return
    try {
      const loaded = await getBookmarks(comic.id)
      setBookmarks(loaded)
    } catch (error) {
      console.error("[reader] Error loading bookmarks:", error)
    }
  }

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleBookmark = useCallback(async () => {
    if (!comic) return
    try {
      const bookmarkId = crypto.randomUUID()
      await saveBookmark({
        id: bookmarkId,
        comicId: comic.id,
        pageNumber: currentPage,
        createdAt: new Date(),
        thumbnailUrl: pageUrls[currentPage],
      })
      await loadBookmarks()
      toast.success(`Page ${currentPage + 1} bookmarked`)
    } catch (error) {
      console.error("[reader] Error saving bookmark:", error)
      toast.error("Failed to save bookmark")
    }
  }, [comic, currentPage, pageUrls])

  const handleQuickNote = useCallback(() => {
    setNoteDialogOpen(true)
  }, [])

  const handleSaveNote = useCallback(async (content: string) => {
    if (!comic) return

    try {
      await saveNote({
        id: crypto.randomUUID(),
        comicId: comic.id,
        pageNumber: currentPage,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        color: "#e85d4d",
      })
      toast.success(`Note added to page ${currentPage + 1}`)
    } catch (error) {
      console.error("[reader] Error saving note:", error)
      toast.error("Failed to save note")
    }
  }, [comic, currentPage])

  // Handler to show controls when mouse is near top edge in fullscreen
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isFullscreen) return

    // Show toolbar when mouse is in top 60px
    if (e.clientY <= 60) {
      setControlsVisible(true)
    } else if (controlsVisible && e.clientY > 120) {
      // Hide when mouse moves away from top area
      setControlsVisible(false)
    }
  }, [isFullscreen, controlsVisible])

  const isCurrentPageBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)

  if (isLoading || !comic) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading comic...</p>
        </div>
      </div>
    )
  }

  // Remote comics have pages loaded from URLs, not files
  const isRemote = comic.sourceType === 'remote'
  const hasContent = isRemote ? remotePageData.length > 0 : (comic.hasFile && comic.totalPages)

  if (!hasContent) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="max-w-md text-center">
          <div className="rounded-full bg-muted p-6 mx-auto w-fit">
            <Upload className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-foreground">{comic.title}</h2>
          {comic.series && (
            <p className="mt-2 text-muted-foreground">
              {comic.series}
              {comic.issue && ` #${comic.issue}`}
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {isRemote
              ? "This comic's pages could not be loaded."
              : `This comic doesn't have a file attached yet. Upload a ${SUPPORTED_FORMATS.description} file to start reading.`
            }
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Library
            </Button>
            {!isRemote && (
              <Button onClick={() => setAttachDialogOpen(true)} className="gap-2">
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
              loadComic()
            }}
          />
        )}
      </div>
    )
  }

  const totalPages = isRemote ? remotePageData.length : (comic.totalPages ?? 0)

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      <ReaderToolbar
        title={comic.title}
        isVisible={controlsVisible}
        onMenuClick={() => setMenuOpen(true)}
        onBookmarkClick={handleBookmark}
        onNoteClick={handleQuickNote}
        isBookmarked={isCurrentPageBookmarked}
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
      />

      <main className="h-full w-full" onClick={toggleControls}>
        <ComicViewer pages={pageUrls} currentPage={currentPage} onPageChange={handlePageChange} />
      </main>

      <PageIndicator
        currentPage={currentPage}
        totalPages={totalPages}
        isVisible={!controlsVisible && !menuOpen && !isFullscreen && (settings.showPageNumbers ?? false) && settings.layoutMode !== "scrolling"}
      />

      <ReaderMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onBookmarkClick={handleBookmark}
        comicId={comic.id}
        pages={pageUrls}
        bookmarks={bookmarks}
        onRefreshBookmarks={loadBookmarks}
      />

      <QuickNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        currentPage={currentPage}
        onSave={handleSaveNote}
      />

      {/* Floating menu button - always visible on desktop, hidden on mobile */}
      <Button
        variant="secondary"
        size="icon"
        className="fixed z-50 hidden h-12 w-12 rounded-full shadow-lg md:flex opacity-70 hover:opacity-100 transition-opacity"
        style={{
          bottom: 'calc(1.5rem + var(--safe-area-bottom))',
          right: 'calc(1.5rem + var(--safe-area-right))'
        }}
        onClick={() => setMenuOpen(true)}
        title="Open menu (M)"
      >
        <Settings2 className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
    </div>
  )
}
