"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Trash2,
  BookOpen,
  FileText,
  ListPlus,
  X,
} from "lucide-react"
import type { Comic } from "@/lib/types"
import { useRouter } from "next/navigation"
import { AddToListDialog } from "./add-to-list-dialog"

interface ComicTableProps {
  comics: Comic[]
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onUpdate?: () => void
  onSelect?: (comic: Comic) => void
}

type SortKey = "title" | "series" | "author" | "progress" | "lastRead"
type SortDirection = "asc" | "desc"

export function ComicTable({
  comics,
  onDelete,
  onBulkDelete,
  onUpdate,
  onSelect,
}: ComicTableProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("title")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [addToListComic, setAddToListComic] = useState<Comic | null>(null)
  const [bulkAddToList, setBulkAddToList] = useState(false)

  const sortedComics = useMemo(() => {
    return [...comics].sort((a, b) => {
      let comparison = 0

      switch (sortKey) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "series":
          comparison = (a.series || "").localeCompare(b.series || "")
          break
        case "author":
          comparison = (a.author || "").localeCompare(b.author || "")
          break
        case "progress":
          const aProgress = a.totalPages ? a.currentPage / a.totalPages : 0
          const bProgress = b.totalPages ? b.currentPage / b.totalPages : 0
          comparison = aProgress - bProgress
          break
        case "lastRead":
          const aTime = a.lastRead ? new Date(a.lastRead).getTime() : 0
          const bTime = b.lastRead ? new Date(b.lastRead).getTime() : 0
          comparison = aTime - bTime
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [comics, sortKey, sortDirection])

  const allSelected = comics.length > 0 && selectedIds.size === comics.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < comics.length

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(comics.map((c) => c.id)))
    }
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  function handleBulkDelete() {
    onBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  function getProgress(comic: Comic): number {
    if (!comic.totalPages) return 0
    return Math.round((comic.currentPage / comic.totalPages) * 100)
  }

  function getStatus(comic: Comic): "want" | "reading" | "completed" | "no-file" {
    if (!comic.hasFile) return "no-file"
    if (!comic.totalPages) return "want"
    const progress = comic.currentPage / comic.totalPages
    if (progress >= 1) return "completed"
    if (progress > 0) return "reading"
    return "want"
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return "-"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function SortHeader({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) {
    const isActive = sortKey === sortKeyName
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent"
        onClick={() => toggleSort(sortKeyName)}
      >
        {label}
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-1 h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        )}
      </Button>
    )
  }

  const statusConfig = {
    "no-file": { label: "No File", variant: "outline" as const },
    want: { label: "Want to Read", variant: "secondary" as const },
    reading: { label: "Reading", variant: "default" as const },
    completed: { label: "Completed", variant: "default" as const },
  }

  if (comics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-muted-foreground">No comics to display</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBulkAddToList(true)}
            className="gap-2"
          >
            <ListPlus className="h-4 w-4" />
            Add to List
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedIds(new Set())}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) (el as HTMLButtonElement).dataset.state = someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"
                  }}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="min-w-[200px]">
                <SortHeader label="Title" sortKeyName="title" />
              </TableHead>
              <TableHead className="min-w-[150px]">
                <SortHeader label="Series" sortKeyName="series" />
              </TableHead>
              <TableHead>
                <SortHeader label="Author" sortKeyName="author" />
              </TableHead>
              <TableHead className="w-[100px]">
                <SortHeader label="Progress" sortKeyName="progress" />
              </TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[80px]">Size</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedComics.map((comic) => {
              const status = getStatus(comic)
              const progress = getProgress(comic)
              const isSelected = selectedIds.has(comic.id)

              return (
                <TableRow
                  key={comic.id}
                  data-state={isSelected ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => onSelect?.(comic)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(comic.id)}
                      aria-label={`Select ${comic.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {comic.coverImage && (
                        <img
                          src={comic.coverImage}
                          alt=""
                          className="h-10 w-7 object-cover rounded-sm"
                        />
                      )}
                      <span className="truncate max-w-[200px]">{comic.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {comic.series ? (
                      <span>
                        {comic.series}
                        {comic.issue && <span className="opacity-70"> #{comic.issue}</span>}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {comic.author || "-"}
                  </TableCell>
                  <TableCell>
                    {comic.totalPages ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {progress}%
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig[status].variant}
                      className={
                        status === "completed"
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : status === "reading"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : ""
                      }
                    >
                      {statusConfig[status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatFileSize(comic.fileSize)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {comic.hasFile && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/reader/${comic.id}`)}
                          >
                            <BookOpen className="mr-2 h-4 w-4" />
                            Read
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onSelect?.(comic)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAddToListComic(comic)}>
                          <ListPlus className="mr-2 h-4 w-4" />
                          Add to List
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(comic.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add to List Dialog for single comic */}
      {addToListComic && (
        <AddToListDialog
          comicId={addToListComic.id}
          open={!!addToListComic}
          onOpenChange={(open) => !open && setAddToListComic(null)}
          onSuccess={onUpdate}
        />
      )}

      {/* Add to List Dialog for bulk */}
      {bulkAddToList && (
        <AddToListDialog
          comicId={Array.from(selectedIds)[0]}
          bulkComicIds={Array.from(selectedIds)}
          open={bulkAddToList}
          onOpenChange={(open) => {
            if (!open) {
              setBulkAddToList(false)
              setSelectedIds(new Set())
            }
          }}
          onSuccess={onUpdate}
        />
      )}
    </div>
  )
}
