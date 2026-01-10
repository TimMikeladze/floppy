"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StickyNote, Trash2, Plus, Edit2 } from "lucide-react"
import type { Note } from "@/lib/types"
import { getNotes, saveNote, deleteNote } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface NotesPanelProps {
  comicId: string
  pages: string[]
  currentPage: number
  onPageSelect: (page: number) => void
  variant?: "icon" | "menu"
}

export function NotesPanel({ comicId, pages, currentPage, onPageSelect, variant = "icon" }: NotesPanelProps) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCurrentPageOnly, setShowCurrentPageOnly] = useState(false)

  useEffect(() => {
    if (open) {
      loadNotes()
    }
  }, [open, comicId])

  async function loadNotes() {
    try {
      const loaded = await getNotes(comicId)
      setNotes(loaded.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()))
    } catch (error) {
      console.error("[v0] Error loading notes:", error)
    }
  }

  async function handleSave(note?: Note) {
    try {
      if (note) {
        await saveNote({
          ...note,
          content: editContent,
          updatedAt: new Date(),
        })
      } else {
        const newNote: Note = {
          id: crypto.randomUUID(),
          comicId,
          pageNumber: currentPage,
          content: editContent,
          createdAt: new Date(),
          updatedAt: new Date(),
          color: "#e85d4d",
        }
        await saveNote(newNote)
      }

      setEditingId(null)
      setEditContent("")
      await loadNotes()
    } catch (error) {
      console.error("[v0] Error saving note:", error)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id)
      await loadNotes()
    } catch (error) {
      console.error("[v0] Error deleting note:", error)
    }
  }

  const filteredNotes = notes
    .filter((n) => !showCurrentPageOnly || n.pageNumber === currentPage)
    .filter((n) => n.content.toLowerCase().includes(searchQuery.toLowerCase()))

  const trigger = variant === "menu" ? (
    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-3">
      <StickyNote className="h-5 w-5" />
      <span className="text-xs">Notes</span>
    </Button>
  ) : (
    <Button variant="ghost" size="icon">
      <StickyNote className="h-5 w-5" />
      <span className="sr-only">View notes</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Notes</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <Button
            onClick={() => {
              setEditingId("new")
              setEditContent("")
            }}
            className="w-full gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Note on Page {currentPage + 1}
          </Button>

          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />

          <Button
            variant={showCurrentPageOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowCurrentPageOnly(!showCurrentPageOnly)}
            className="w-full"
          >
            {showCurrentPageOnly ? "Show All Notes" : "Show Current Page Only"}
          </Button>
        </div>

        {editingId === "new" && (
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <div className="mb-2 text-sm font-medium text-foreground">New Note - Page {currentPage + 1}</div>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your note..."
              className="min-h-[80px]"
              autoFocus
            />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => handleSave()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setEditContent("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 -mx-6 px-6">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <StickyNote className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{searchQuery ? "No matching notes" : "No notes yet"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md"
                  style={{ borderLeftWidth: "4px", borderLeftColor: note.color || "#e85d4d" }}
                >
                  {editingId === note.id ? (
                    <div className="p-4 space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(note)}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null)
                            setEditContent("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        onPageSelect(note.pageNumber)
                        setOpen(false)
                      }}
                      className="flex w-full items-start gap-3 p-3 text-left"
                    >
                      <div className="relative aspect-[2/3] w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                        <img
                          src={pages[note.pageNumber] || "/placeholder.svg"}
                          alt={`Page ${note.pageNumber + 1}`}
                          className="h-full w-full object-contain"
                        />
                        {note.pageNumber === currentPage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">Page {note.pageNumber + 1}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  )}

                  {editingId !== note.id && (
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(note.id)
                          setEditContent(note.content)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Edit note</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(note.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete note</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
