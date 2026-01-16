"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookmarkIcon, StickyNote, Trash2, Search, Calendar, Book } from "lucide-react"
import { getAllBookmarks, getAllNotes, getComic, deleteBookmark, deleteNote } from "@/lib/storage"
import type { Bookmark, Note, Comic } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface BookmarkWithComic extends Bookmark {
  comic?: Comic
}

interface NoteWithComic extends Note {
  comic?: Comic
}

export default function CollectionsPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkWithComic[]>([])
  const [notes, setNotes] = useState<NoteWithComic[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "comic" | "page">("recent")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [allBookmarks, allNotes] = await Promise.all([getAllBookmarks(), getAllNotes()])

      const bookmarksWithComics = await Promise.all(
        allBookmarks.map(async (bookmark) => {
          const comic = await getComic(bookmark.comicId)
          return { ...bookmark, comic: comic || undefined }
        }),
      )

      const notesWithComics = await Promise.all(
        allNotes.map(async (note) => {
          const comic = await getComic(note.comicId)
          return { ...note, comic: comic || undefined }
        }),
      )

      setBookmarks(bookmarksWithComics)
      setNotes(notesWithComics)
    } catch (error) {
      console.error("[v0] Error loading collections:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDeleteBookmark(id: string) {
    if (!confirm("Delete this bookmark?")) return
    try {
      await deleteBookmark(id)
      await loadData()
    } catch (error) {
      console.error("[v0] Error deleting bookmark:", error)
    }
  }

  async function handleDeleteNote(id: string) {
    if (!confirm("Delete this note?")) return
    try {
      await deleteNote(id)
      await loadData()
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
    }
  }

  function sortItems<T extends BookmarkWithComic | NoteWithComic>(items: T[]): T[] {
    const sorted = [...items]

    if (sortBy === "recent") {
      sorted.sort((a, b) => {
        const aTime = "updatedAt" in a ? a.updatedAt.getTime() : a.createdAt.getTime()
        const bTime = "updatedAt" in b ? b.updatedAt.getTime() : b.createdAt.getTime()
        return bTime - aTime
      })
    } else if (sortBy === "comic") {
      sorted.sort((a, b) => (a.comic?.title || "").localeCompare(b.comic?.title || ""))
    } else if (sortBy === "page") {
      sorted.sort((a, b) => a.pageNumber - b.pageNumber)
    }

    return sorted
  }

  const filteredBookmarks = sortItems(
    bookmarks.filter(
      (b) =>
        b.comic?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
    ),
  )

  const filteredNotes = sortItems(
    notes.filter(
      (n) =>
        n.comic?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/library">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to library</span>
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Collections</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>
              <Calendar className="mr-2 h-4 w-4" />
              Recent
            </Button>
            <Button variant={sortBy === "comic" ? "default" : "outline"} size="sm" onClick={() => setSortBy("comic")}>
              <Book className="mr-2 h-4 w-4" />
              Comic
            </Button>
          </div>
        </div>

        <Tabs defaultValue="bookmarks" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="bookmarks" className="gap-2">
              <BookmarkIcon className="h-4 w-4" />
              Bookmarks ({filteredBookmarks.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <StickyNote className="h-4 w-4" />
              Notes ({filteredNotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookmarks" className="mt-6">
            {isLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading bookmarks...</p>
                </div>
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center">
                <div className="rounded-full bg-muted p-6">
                  <BookmarkIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-4 text-lg font-medium text-foreground">No bookmarks yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Bookmark pages while reading to find them here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg"
                  >
                    <Link href={`/reader/${bookmark.comicId}`} className="block">
                      <div className="aspect-[3/2] overflow-hidden bg-muted">
                        {bookmark.thumbnailUrl ? (
                          <img
                            src={bookmark.thumbnailUrl || "/placeholder.svg"}
                            alt={`Page ${bookmark.pageNumber + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <BookmarkIcon className="h-12 w-12" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {bookmark.comic?.title || "Unknown Comic"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">Page {bookmark.pageNumber + 1}</p>

                        {bookmark.note && <p className="mt-2 text-sm text-foreground line-clamp-2">{bookmark.note}</p>}

                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {bookmark.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="mt-3 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteBookmark(bookmark.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete bookmark</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            {isLoading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading notes...</p>
                </div>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center">
                <div className="rounded-full bg-muted p-6">
                  <StickyNote className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-4 text-lg font-medium text-foreground">No notes yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Add notes while reading to find them here</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg"
                    style={{ borderLeftWidth: "4px", borderLeftColor: note.color || "#e85d4d" }}
                  >
                    <Link href={`/reader/${note.comicId}`} className="block p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground line-clamp-1">
                          {note.comic?.title || "Unknown Comic"}
                        </h3>
                        <Badge variant="outline" className="ml-2 flex-shrink-0 text-xs">
                          Page {note.pageNumber + 1}
                        </Badge>
                      </div>

                      <p className="whitespace-pre-wrap text-sm text-foreground line-clamp-4">{note.content}</p>

                      <p className="mt-3 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                      </p>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteNote(note.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete note</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
