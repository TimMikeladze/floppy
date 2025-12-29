"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search, BookOpen, Library, Sparkles, Settings, Upload, Plus } from "lucide-react"
import { getAllComics } from "@/lib/storage"
import type { Comic } from "@/lib/types"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface CommandPaletteProps {
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [comics, setComics] = useState<Comic[]>([])
  const [search, setSearch] = useState("")
  const router = useRouter()

  // Load comics when palette opens
  useEffect(() => {
    if (open) {
      loadComics()
    }
  }, [open])

  async function loadComics() {
    try {
      const allComics = await getAllComics()
      setComics(allComics)
    } catch (error) {
      console.error("Failed to load comics:", error)
    }
  }

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    setOpen(open)
    onOpenChange?.(open)
    if (!open) {
      setSearch("")
    }
  }, [onOpenChange])

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false)
    setSearch("")
    callback()
  }, [])

  // Filter comics based on search
  const filteredComics = comics.filter((comic) => {
    const query = search.toLowerCase()
    return (
      comic.title.toLowerCase().includes(query) ||
      comic.series?.toLowerCase().includes(query) ||
      comic.issue?.toLowerCase().includes(query) ||
      comic.author?.toLowerCase().includes(query)
    )
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden">
        <Command shouldFilter={false} className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search comics or type a command..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Navigation Commands */}
            {!search && (
              <Command.Group heading="Navigation">
                <Command.Item
                  onSelect={() => handleSelect(() => router.push("/"))}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Library className="h-4 w-4" />
                  <span>Library</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => router.push("/releases"))}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Releases</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Comics */}
            {filteredComics.length > 0 && (
              <Command.Group heading={search ? "Comics" : "Recent Comics"}>
                {(search ? filteredComics : filteredComics.slice(0, 8)).map((comic) => (
                  <Command.Item
                    key={comic.id}
                    value={comic.id}
                    onSelect={() => handleSelect(() => router.push(`/reader/${comic.id}`))}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <div className="flex-shrink-0">
                      {comic.coverImage ? (
                        <img
                          src={comic.coverImage}
                          alt=""
                          className="h-10 w-7 object-cover rounded-sm"
                        />
                      ) : (
                        <div className="h-10 w-7 rounded-sm bg-muted flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{comic.title}</div>
                      {comic.series && (
                        <div className="text-xs text-muted-foreground truncate">
                          {comic.series}
                          {comic.issue && ` #${comic.issue}`}
                        </div>
                      )}
                    </div>
                    {comic.currentPage > 0 && comic.totalPages && (
                      <div className="text-xs text-muted-foreground">
                        {Math.round((comic.currentPage / comic.totalPages) * 100)}%
                      </div>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
              <span>Toggle</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
