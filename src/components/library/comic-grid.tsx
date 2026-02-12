"use client"

import { useRef, useState, useEffect } from "react"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateColumns = () => {
      const width = el.offsetWidth
      const gap =
        window.innerWidth >= 1024
          ? 24
          : window.innerWidth >= 768
            ? 20
            : window.innerWidth >= 640
              ? 16
              : 12
      const minItemWidth = 140
      setColumns(Math.max(1, Math.floor((width + gap) / (minItemWidth + gap))))
    }

    updateColumns()
    const observer = new ResizeObserver(updateColumns)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rowCount = Math.ceil(comics.length / columns)

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 260,
    overscan: 3,
    scrollMargin: containerRef.current?.offsetTop ?? 0,
  })

  if (comics.length === 0) {
    return <LibraryEmptyState onUpload={onUpload} />
  }

  return (
    <div ref={containerRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns
          const rowComics = comics.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <div
                className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
                }}
              >
                {rowComics.map((comic) => (
                  <ComicCard
                    key={comic.id}
                    comic={comic}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
