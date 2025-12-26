"use client"

import { useState, useEffect, Suspense } from "react"
import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs"
import { LibraryHeader } from "@/components/library/library-header"
import { ComicGrid } from "@/components/library/comic-grid"
import { ComicTable } from "@/components/library/comic-table"
import { UploadDialog } from "@/components/library/upload-dialog"
import { ListManager } from "@/components/library/list-manager"
import { ComicDetailSheet } from "@/components/library/comic-detail-sheet"
import { parseComicFile, generateCoverImage, SUPPORTED_FORMATS, detectFormat } from "@/lib/comic-parser"
import { getAllComics, saveComic, deleteComic, getAllLists, exportLibrary, importLibrary, clearAllData, savePagesForComic } from "@/lib/storage"
import type { FileWithHandle } from "@/components/library/upload-dialog"
import type { Comic, ComicList } from "@/lib/types"
import { AddComicDialogControlled } from "@/components/library/add-comic-dialog"
import { ImportDataSourceDialog } from "@/components/library/import-data-source-dialog"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const filterTypes = ["all", "reading", "completed", "want"] as const
type FilterType = (typeof filterTypes)[number]

const sortTypes = ["title", "recent", "progress"] as const
type SortType = (typeof sortTypes)[number]

const viewModes = ["grid", "table"] as const
type ViewMode = (typeof viewModes)[number]

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageLoading />}>
      <HomePageContent />
    </Suspense>
  )
}

function HomePageLoading() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto p-6 rounded-3xl mb-4 inline-block"
            style={{
              background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
              boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border)'
            }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading library...</p>
        </div>
      </div>
    </div>
  )
}

function HomePageContent() {
  // URL state with nuqs
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""))
  const [sortBy, setSortBy] = useQueryState("sort", parseAsStringLiteral(sortTypes).withDefault("recent"))
  const [viewMode, setViewMode] = useQueryState("view", parseAsStringLiteral(viewModes).withDefault("grid"))
  const [activeFilter, setActiveFilter] = useQueryState("filter", parseAsStringLiteral(filterTypes).withDefault("all"))
  const [selectedListId, setSelectedListId] = useQueryState("list", parseAsString)

  // Local state
  const [comics, setComics] = useState<Comic[]>([])
  const [filteredComics, setFilteredComics] = useState<Comic[]>([])
  const [lists, setLists] = useState<ComicList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [addComicDialogOpen, setAddComicDialogOpen] = useState(false)
  const [importDataSourceDialogOpen, setImportDataSourceDialogOpen] = useState(false)
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
      setComics(allComics)
    } catch (error) {
      console.error("Error loading comics:", error)
      toast.error("Failed to load comics")
    } finally {
      setIsLoading(false)
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

  async function handleFilesSelected(filesWithHandles: FileWithHandle[]) {
    if (!filesWithHandles || filesWithHandles.length === 0) return

    const validExtensions = SUPPORTED_FORMATS.extensions
    const validFiles = filesWithHandles.filter(({ file }) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
      return validExtensions.includes(ext)
    })

    if (validFiles.length === 0) {
      toast.error(`Please upload ${SUPPORTED_FORMATS.description} files`)
      return
    }

    setIsLoading(true)
    const toastId = toast.loading(`Importing ${validFiles.length} comic${validFiles.length > 1 ? "s" : ""}...`)

    let successCount = 0
    let failCount = 0

    for (const { file, handle } of validFiles) {
      try {
        const { pages, metadata } = await parseComicFile(file)
        const coverImage = await generateCoverImage(pages[0])

        const comicId = crypto.randomUUID()

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
          fileHandle: handle,
          sourceType: 'local',
        }

        await saveComic(comic)

        // If no file handle (iOS/Safari), store pages in IndexedDB
        if (!handle) {
          await savePagesForComic(comicId, pages)
        }

        successCount++
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        failCount++
      }
    }

    await loadComics()

    toast.dismiss(toastId)
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

  async function handleBulkDelete(ids: string[]) {
    const toastId = toast.loading(`Deleting ${ids.length} comics...`)
    try {
      for (const id of ids) {
        await deleteComic(id)
      }
      setComics((prev) => prev.filter((c) => !ids.includes(c.id)))
      toast.dismiss(toastId)
      toast.success(`Deleted ${ids.length} comics`)
    } catch (error) {
      console.error("Error deleting comics:", error)
      toast.dismiss(toastId)
      toast.error("Failed to delete some comics")
    }
  }

  async function handleExport() {
    const toastId = toast.loading("Exporting library...")
    try {
      const blob = await exportLibrary()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `floppy-library-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.dismiss(toastId)
      toast.success("Library exported successfully")
    } catch (error) {
      console.error("Error exporting library:", error)
      toast.dismiss(toastId)
      toast.error("Failed to export library")
    }
  }

  async function handleImport(file: File) {
    const toastId = toast.loading("Importing library...")
    try {
      const result = await importLibrary(file, { merge: true })
      await loadComics()
      await loadLists()
      toast.dismiss(toastId)
      toast.success("Library imported", {
        description: `${result.comics} comics, ${result.bookmarks} bookmarks, ${result.notes} notes`,
      })
    } catch (error) {
      console.error("Error importing library:", error)
      toast.dismiss(toastId)
      toast.error("Failed to import library", {
        description: error instanceof Error ? error.message : "Invalid file format",
      })
    }
  }

  async function handleClearData() {
    const toastId = toast.loading("Clearing all data...")
    try {
      await clearAllData()
      setComics([])
      setLists([])
      toast.dismiss(toastId)
      toast.success("All data cleared")
    } catch (error) {
      console.error("Error clearing data:", error)
      toast.dismiss(toastId)
      toast.error("Failed to clear data")
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <LibraryHeader
        onUpload={handleUploadClick}
        onAddComic={() => setAddComicDialogOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onManageLists={() => setListsSheetOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onImportDataSource={() => setImportDataSourceDialogOpen(true)}
        onClearData={handleClearData}
      />

      {/* Filter Pills */}
      <div className="sticky top-14 z-30 border-b border-border/50" style={{
        background: 'oklch(from var(--background) l c h / 0.9)',
        backdropFilter: 'blur(20px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.1)'
      }}>
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-3 py-3 sm:px-4 md:px-6">
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
      <main className="px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
        {isLoading && comics.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div
                className="mx-auto p-6 rounded-3xl mb-4 inline-block"
                style={{
                  background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
                  boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border)'
                }}
              >
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Loading library...</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <ComicGrid
            comics={filteredComics}
            onDelete={handleDelete}
            onUpdate={loadComics}
            onSelect={handleComicSelect}
            onUpload={handleUploadClick}
          />
        ) : (
          <ComicTable
            comics={filteredComics}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onUpdate={loadComics}
            onSelect={handleComicSelect}
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

      {/* Lists Management Dialog */}
      <Dialog open={listsSheetOpen} onOpenChange={setListsSheetOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Lists</DialogTitle>
            <DialogDescription>Create and organize your comic lists</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <ListManager onListsChange={loadLists} />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Comic Dialog */}
      <AddComicDialogControlled
        open={addComicDialogOpen}
        onOpenChange={setAddComicDialogOpen}
        onComicAdded={loadComics}
      />

      {/* Import Data Source Dialog */}
      <ImportDataSourceDialog
        open={importDataSourceDialogOpen}
        onOpenChange={setImportDataSourceDialogOpen}
        onImportComplete={loadComics}
      />
    </div>
  )
}
