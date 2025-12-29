"use client"

import { useState, useEffect } from "react"
import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs"
import { AppLayout } from "@/components/layout/app-layout"
import { ComicGrid } from "@/components/library/comic-grid"
import { ComicTable } from "@/components/library/comic-table"
import { getAllComics, deleteComic, getAllLists } from "@/lib/storage"
import type { Comic, ComicList } from "@/lib/types"
import { ImportDataSourceDialog } from "@/components/library/import-data-source-dialog"
import { toast } from "sonner"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const filterTypes = ["all", "reading", "completed", "want"] as const
type FilterType = (typeof filterTypes)[number]

const sortTypes = ["title", "recent", "progress"] as const
type SortType = (typeof sortTypes)[number]

const viewModes = ["grid", "table"] as const
type ViewMode = (typeof viewModes)[number]

interface HomePageClientProps {
  csvImportEnabled: boolean
}

export function HomePageClient({ csvImportEnabled }: HomePageClientProps) {
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
  const [importDataSourceDialogOpen, setImportDataSourceDialogOpen] = useState(false)

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

  const filterCounts = getFilterCounts()

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: filterCounts.all },
    { key: "reading", label: "Reading", count: filterCounts.reading },
    { key: "want", label: "Want to Read", count: filterCounts.want },
    { key: "completed", label: "Completed", count: filterCounts.completed },
  ]

  async function handleDataChange() {
    await loadComics()
    await loadLists()
  }

  return (
    <AppLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sortBy={sortBy}
      onSortChange={setSortBy}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      onDataChange={handleDataChange}
      onListsChange={loadLists}
      filterPills={
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-3 py-3 sm:px-4 md:px-6 mx-auto w-full max-w-screen-2xl">
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
      }
    >
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
        />
      ) : (
        <ComicTable
          comics={filteredComics}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onUpdate={loadComics}
        />
      )}

      {/* Import Data Source Dialog (Library-specific) */}
      {csvImportEnabled && (
        <ImportDataSourceDialog
          open={importDataSourceDialogOpen}
          onOpenChange={setImportDataSourceDialogOpen}
          onImportComplete={loadComics}
        />
      )}
    </AppLayout>
  )
}
