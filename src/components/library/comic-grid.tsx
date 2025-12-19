"use client"

import { ComicCard } from "./comic-card"
import type { Comic } from "@/lib/types"
import { BookOpen, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ComicGridProps {
  comics: Comic[]
  onDelete: (id: string) => void
  onUpdate?: () => void
  onSelect?: (comic: Comic) => void
  onUpload?: () => void
}

export function ComicGrid({ comics, onDelete, onUpdate, onSelect, onUpload }: ComicGridProps) {
  if (comics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(var(--glass-blur))',
            WebkitBackdropFilter: 'blur(var(--glass-blur))',
            borderColor: 'var(--glass-border)',
            boxShadow: '0 4px 16px var(--glass-shadow)'
          }}
        >
          <BookOpen className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No comics yet</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-6">
          Upload your first comic to get started. We support CBZ and ZIP files.
        </p>
        {onUpload && (
          <Button onClick={onUpload} className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Comic
          </Button>
        )}
      </div>
    )
  }

  return (
    <div
      className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
      }}
    >
      {comics.map((comic) => (
        <ComicCard
          key={comic.id}
          comic={comic}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
