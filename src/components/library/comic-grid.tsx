"use client"

import { ComicCard } from "./comic-card"
import { LibraryEmptyState } from "./library-empty-state"
import type { Comic } from "@/lib/types"

interface ComicGridProps {
  comics: Comic[]
  onDelete: (id: string) => void
  onUpdate?: () => void
  onSelect?: (comic: Comic) => void
  onUpload?: () => void
}

export function ComicGrid({ comics, onDelete, onUpdate, onSelect, onUpload }: ComicGridProps) {
  if (comics.length === 0) {
    return <LibraryEmptyState onUpload={onUpload} />
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
