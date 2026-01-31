"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
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

// Minimum card width matches the CSS minmax value
const MIN_CARD_WIDTH = 140
// Gap between cards (matches gap-3 to gap-6 based on viewport)
const getGap = (width: number) => {
  if (width >= 1024) return 24 // lg:gap-6
  if (width >= 768) return 20 // md:gap-5
  if (width >= 640) return 16 // sm:gap-4
  return 12 // gap-3
}

// Estimated row height - comic cards have aspect ratio ~2:3 plus text
// This is an approximation; actual heights may vary slightly
const ESTIMATED_ROW_HEIGHT = 280

export function ComicGrid({ comics, onDelete, onUpdate, onSelect, onUpload }: ComicGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // Measure container width
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Calculate number of columns based on container width
  const columns = useMemo(() => {
    if (containerWidth === 0) return 1
    const gap = getGap(containerWidth)
    // Calculate how many columns fit: (containerWidth + gap) / (minWidth + gap)
    return Math.max(1, Math.floor((containerWidth + gap) / (MIN_CARD_WIDTH + gap)))
  }, [containerWidth])

  // Split comics into rows
  const rows = useMemo(() => {
    const result: Comic[][] = []
    for (let i = 0; i < comics.length; i += columns) {
      result.push(comics.slice(i, i + columns))
    }
    return result
  }, [comics, columns])

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () =>
      typeof window !== "undefined" ? document.documentElement : null,
    estimateSize: useCallback(() => ESTIMATED_ROW_HEIGHT, []),
    overscan: 3,
  })

  if (comics.length === 0) {
    return <LibraryEmptyState onUpload={onUpload} />
  }

  const gap = containerWidth ? getGap(containerWidth) : 12

  return (
    <div ref={containerRef}>
      {containerWidth > 0 && (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowComics = rows[virtualRow.index]
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
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: `${gap}px`,
                    paddingBottom: `${gap}px`,
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
      )}
    </div>
  )
}
