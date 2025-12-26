"use client"

import { useState, useEffect, useCallback, use } from "react"
import { ComicViewer } from "@/components/reader/comic-viewer"
import { ReaderToolbar } from "@/components/reader/reader-toolbar"
import { ReaderMenu } from "@/components/reader/reader-menu"
import { PageIndicator } from "@/components/reader/page-indicator"
import { QuickNoteDialog } from "@/components/reader/quick-note-dialog"
import { getComic, updateReadingProgress, saveBookmark, getBookmarks, saveNote, loadPagesFromHandle, getPagesForComic } from "@/lib/storage"
import { SUPPORTED_FORMATS } from "@/lib/comic-parser"
import type { Comic, Bookmark } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { AttachFileDialog } from "@/components/library/attach-file-dialog"

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [comic, setComic] = useState<Comic | null>(null)
  const [pageUrls, setPageUrls] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
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

  const toggleControls = useCallback(() => {
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

  if (!comic.hasFile || !comic.totalPages) {
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
            This comic doesn't have a file attached yet. Upload a {SUPPORTED_FORMATS.description} file to start reading.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to Library
            </Button>
            <Button onClick={() => setAttachDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Attach File
            </Button>
          </div>
        </div>
        <AttachFileDialog
          comicId={comic.id}
          open={attachDialogOpen}
          onOpenChange={setAttachDialogOpen}
          onFileAttached={() => {
            loadComic()
          }}
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <ReaderToolbar
        title={comic.title}
        isVisible={controlsVisible}
        onMenuClick={() => setMenuOpen(true)}
        onBookmarkClick={handleBookmark}
        onNoteClick={handleQuickNote}
        isBookmarked={isCurrentPageBookmarked}
      />

      <main className="h-full w-full" onClick={toggleControls}>
        <ComicViewer pages={pageUrls} currentPage={currentPage} onPageChange={handlePageChange} />
      </main>

      <PageIndicator
        currentPage={currentPage}
        totalPages={comic.totalPages}
        isVisible={!controlsVisible && !menuOpen}
      />

      <ReaderMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        currentPage={currentPage}
        totalPages={comic.totalPages}
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
    </div>
  )
}
