"use client"

import { useState, useEffect } from "react"
import { LibraryHeader } from "@/components/library/library-header"
import { ComicGrid } from "@/components/library/comic-grid"
import { UploadDialog } from "@/components/library/upload-dialog"
import { AddComicDialog } from "@/components/library/add-comic-dialog"
import { ListManager } from "@/components/library/list-manager"
import { ComicDetailSheet } from "@/components/library/comic-detail-sheet"
import { parseComicFile, generateCoverImage, SUPPORTED_FORMATS, detectFormat } from "@/lib/comic-parser"
import { getAllComics, saveComic, deleteComic, savePage, getAllLists, initializeDefaultLists } from "@/lib/storage"
import { loadMockComics } from "@/lib/mock-data"
import type { Comic, ComicList } from "@/lib/types"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

type FilterType = "all" | "reading" | "completed" | "want"

export default function HomePage() {
  const [comics, setComics] = useState<Comic[]>([])
  const [filteredComics, setFilteredComics] = useState<Comic[]>([])
  const [lists, setLists] = useState<ComicList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"title" | "recent" | "progress">("recent")
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializingMocks, setIsInitializingMocks] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [addComicDialogOpen, setAddComicDialogOpen] = useState(false)
  const [listsSheetOpen, setListsSheetOpen] = useState(false)
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null)
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)

  useEffect(() => {
    loadComics()
    loadLists()
  }, [])

  useEffect(() => {
    filterAndSortComics()
  }, [comics, searchQuery, sortBy, selectedListId, lists, activeFilter])

  async function loadComics() {
    try {
      const allComics = await getAllComics()

      if (allComics.length === 0 && !isInitializingMocks) {
        setIsInitializingMocks(true)
        toast.info("Loading sample comics...")

        await initializeDefaultLists()
        await loadMockComics()
        const updatedComics = await getAllComics()
        setComics(updatedComics)

        toast.success("Sample comics loaded")
      } else {
        setComics(allComics)
      }
    } catch (error) {
      console.error("Error loading comics:", error)
      toast.error("Failed to load comics")
    } finally {
      setIsLoading(false)
      setIsInitializingMocks(false)
    }
  }

  async function loadLists() {
    const allLists = await getAllLists()
    setLists(allLists)
  }

  function filterAndSortComics() {
    let filtered = [...comics]

    // Apply list filter
    if (selectedListId) {
      const selectedList = lists.find((list) => list.id === selectedListId)
      if (selectedList) {
        filtered = filtered.filter((comic) => selectedList.comicIds.includes(comic.id))
      }
    }

    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((comic) => {
        if (!comic.totalPages) return activeFilter === "want"
        const progress = comic.currentPage / comic.totalPages

        switch (activeFilter) {
          case "reading":
            return progress > 0 && progress < 1
          case "completed":
            return progress >= 1
          case "want":
            return progress === 0
          default:
            return true
        }
      })
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (comic) =>
          comic.title.toLowerCase().includes(query) ||
          comic.series?.toLowerCase().includes(query) ||
          comic.issue?.toLowerCase().includes(query),
      )
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title)
      } else if (sortBy === "recent") {
        const aTime = a.lastRead ? new Date(a.lastRead).getTime() : 0
        const bTime = b.lastRead ? new Date(b.lastRead).getTime() : 0
        return bTime - aTime
      } else if (sortBy === "progress") {
        const aProgress = a.totalPages ? a.currentPage / a.totalPages : 0
        const bProgress = b.totalPages ? b.currentPage / b.totalPages : 0
        return bProgress - aProgress
      }
      return 0
    })

    setFilteredComics(filtered)
  }

  function getFilterCounts() {
    const counts = { all: comics.length, reading: 0, completed: 0, want: 0 }

    comics.forEach((comic) => {
      if (!comic.totalPages) {
        counts.want++
        return
      }
      const progress = comic.currentPage / comic.totalPages
      if (progress >= 1) counts.completed++
      else if (progress > 0) counts.reading++
      else counts.want++
    })

    return counts
  }

  function handleUploadClick() {
    setUploadDialogOpen(true)
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return

    const validExtensions = SUPPORTED_FORMATS.extensions
    const validFiles = Array.from(files).filter((file) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
      return validExtensions.includes(ext)
    })

    if (validFiles.length === 0) {
      toast.error(`Please upload ${SUPPORTED_FORMATS.description} files`)
      return
    }

    setIsLoading(true)
    toast.loading(`Importing ${validFiles.length} comic${validFiles.length > 1 ? "s" : ""}...`)

    let successCount = 0
    let failCount = 0

    for (const file of validFiles) {
      try {
        const { pages, metadata, pdfData } = await parseComicFile(file)
        const coverImage = await generateCoverImage(pages[0])

        const comicId = crypto.randomUUID()

        // Save pages (for PDFs in native mode, we save the raw PDF data as page 0)
        if (pdfData) {
          // Native PDF mode - store raw PDF data
          await savePage(comicId, -1, new Blob([pdfData], { type: "application/pdf" }))
          // Still save cover as page 0 for thumbnails
          await savePage(comicId, 0, pages[0])
        } else {
          // Image-based mode - save all pages
          for (let i = 0; i < pages.length; i++) {
            await savePage(comicId, i, pages[i])
          }
        }

        const comic: Comic = {
          id: comicId,
          title: metadata.title,
          coverImage,
          totalPages: metadata.totalPages,
          currentPage: 0,
          fileName: metadata.fileName,
          fileSize: metadata.fileSize,
          hasFile: true,
          format: metadata.format,
          pdfRenderMode: pdfData ? "native" : undefined,
        }

        await saveComic(comic)
        successCount++
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        failCount++
      }
    }

    await loadComics()

    if (successCount > 0) {
      toast.success(
        `${successCount} comic${successCount > 1 ? "s" : ""} imported`,
        failCount > 0 ? { description: `${failCount} failed` } : undefined,
      )
    } else {
      toast.error("Failed to import comics")
    }

    setIsLoading(false)
  }

  async function handleDelete(id: string) {
    try {
      await deleteComic(id)
      setComics((prev) => prev.filter((c) => c.id !== id))
      toast.success("Comic deleted")
    } catch (error) {
      console.error("Error deleting comic:", error)
      toast.error("Failed to delete comic")
    }
  }

  function handleComicSelect(comic: Comic) {
    setSelectedComic(comic)
    setDetailSheetOpen(true)
  }

  const filterCounts = getFilterCounts()

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: filterCounts.all },
    { key: "reading", label: "Reading", count: filterCounts.reading },
    { key: "want", label: "Want to Read", count: filterCounts.want },
    { key: "completed", label: "Completed", count: filterCounts.completed },
  ]

  return (
    <div className="min-h-screen bg-background">
      <LibraryHeader
        onUpload={handleUploadClick}
        onAddComic={() => setAddComicDialogOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onManageLists={() => setListsSheetOpen(true)}
      />

      {/* Filter Pills */}
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-4 py-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => {
                  setActiveFilter(filter.key)
                  setSelectedListId(null)
                }}
                className={`filter-pill haptic-press ${activeFilter === filter.key && !selectedListId ? "active" : ""}`}
              >
                {filter.label}
                <span className="count">{filter.count}</span>
              </button>
            ))}

            {/* List filters */}
            {lists.map((list) => {
              const count = comics.filter((comic) => list.comicIds.includes(comic.id)).length
              return (
                <button
                  key={list.id}
                  onClick={() => {
                    setSelectedListId(list.id)
                    setActiveFilter("all")
                  }}
                  className={`filter-pill haptic-press ${selectedListId === list.id ? "active" : ""}`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  {list.name}
                  <span className="count">{count}</span>
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Main Content */}
      <main className="px-4 py-5 sm:px-6">
        {isLoading && comics.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading library...</p>
            </div>
          </div>
        ) : (
          <ComicGrid
            comics={filteredComics}
            onDelete={handleDelete}
            onUpdate={loadComics}
            onSelect={handleComicSelect}
            onUpload={handleUploadClick}
          />
        )}
      </main>

      {/* Comic Detail Sheet */}
      <ComicDetailSheet
        comic={selectedComic}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onDelete={handleDelete}
        onUpdate={loadComics}
      />

      {/* Upload Dialog */}
      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onFilesSelected={handleFilesSelected} />

      {/* Add Comic Dialog */}
      <AddComicDialog onComicAdded={loadComics} />

      {/* Lists Management Sheet */}
      <Sheet open={listsSheetOpen} onOpenChange={setListsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manage Lists</SheetTitle>
            <SheetDescription>Create and organize your comic lists</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ListManager onListsChange={loadLists} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
