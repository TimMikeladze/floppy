"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Check, X } from "lucide-react"
import { saveNote } from "@/lib/storage"
import type { Note } from "@/lib/types"

interface QuickNoteButtonProps {
  comicId: string
  currentPage: number
  onNoteSaved?: () => void
}

export function QuickNoteButton({ comicId, currentPage, onNoteSaved }: QuickNoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!content.trim()) return

    setIsSaving(true)
    try {
      const newNote: Note = {
        id: crypto.randomUUID(),
        comicId,
        pageNumber: currentPage,
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        color: "#e85d4d",
      }

      await saveNote(newNote)
      setContent("")
      setIsOpen(false)
      if (onNoteSaved) onNoteSaved()
    } catch (error) {
      console.error("[v0] Error saving note:", error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
        <PlusCircle className="h-5 w-5" />
        <span className="sr-only">Quick note</span>
      </Button>
    )
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-lg md:bottom-24">
      <div className="mb-2 text-sm font-medium text-foreground">Quick Note - Page {currentPage + 1}</div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a note about this page..."
        className="mb-3 min-h-[80px]"
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={!content.trim() || isSaving} className="gap-2">
          <Check className="h-4 w-4" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setIsOpen(false)
            setContent("")
          }}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
