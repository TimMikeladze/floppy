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
      <div className="empty-state-container flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[60vh] px-4 sm:px-6 text-center relative pb-24 sm:pb-0">
        {/* Decorative background glow */}
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)'
          }}
        />

        {/* Icon container with gradient border */}
        <div
          className="empty-state-icon w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 sm:mb-8 relative"
          style={{
            background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
            boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)'
          }}
        >
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-primary" strokeWidth={1.5} />
        </div>

        <h2 className="empty-state-title text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-foreground">No comics yet</h2>
        <p className="empty-state-description text-muted-foreground text-sm sm:text-base max-w-xs sm:max-w-sm mb-3 sm:mb-4 leading-relaxed">
          Upload your first comic to get started.
        </p>
        <p className="text-muted-foreground/80 text-xs sm:text-sm max-w-xs sm:max-w-sm mb-6 sm:mb-8 leading-relaxed">
          Supports CBZ, CBR, PDF, and ZIP files.
          <span className="hidden sm:inline"><br />All comics are stored offline on your device.</span>
        </p>

        {/* Mobile hint */}
        <p className="sm:hidden text-muted-foreground/60 text-xs mb-4">
          Tap the upload button below to add comics
        </p>

        {/* Desktop CTA */}
        {onUpload && (
          <Button
            onClick={onUpload}
            size="lg"
            className="hidden sm:flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 px-8"
          >
            <Upload className="w-5 h-5" />
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
