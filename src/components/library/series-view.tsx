"use client"

import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ChevronDown, ChevronRight, AlertCircle, BookOpen } from "lucide-react"
import type { Comic, SeriesGroup } from "@/lib/types"
import { getSeriesName, getIssueNumber, normalizeSeriesName } from "@/lib/series-utils"
import { ComicCard } from "./comic-card"
import { LibraryEmptyState } from "./library-empty-state"
import { cn } from "@/lib/utils"

interface SeriesViewProps {
  comics: Comic[]
  onDelete: (id: string) => void
  onUpdate?: () => void
  onUpload?: () => void
}

function groupComicsBySeries(comics: Comic[]): SeriesGroup[] {
  const seriesMap = new Map<string, Comic[]>()

  for (const comic of comics) {
    const seriesName = getSeriesName(comic)
    const normalized = normalizeSeriesName(seriesName)

    if (!seriesMap.has(normalized)) {
      seriesMap.set(normalized, [])
    }
    seriesMap.get(normalized)!.push(comic)
  }

  const groups: SeriesGroup[] = []

  for (const [normalizedName, seriesComics] of seriesMap) {
    // Sort by issue number
    const sortedComics = [...seriesComics].sort((a, b) => {
      const aIssue = getIssueNumber(a)
      const bIssue = getIssueNumber(b)
      if (aIssue === null && bIssue === null) return a.title.localeCompare(b.title)
      if (aIssue === null) return 1
      if (bIssue === null) return -1
      return aIssue - bIssue
    })

    // Calculate read count
    const readCount = sortedComics.filter(c => {
      if (!c.totalPages) return false
      return c.currentPage >= c.totalPages
    }).length

    // Find missing issues
    const issueNumbers = sortedComics
      .map(c => getIssueNumber(c))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b)

    const missingIssues: number[] = []
    if (issueNumbers.length > 1) {
      const min = issueNumbers[0]
      const max = issueNumbers[issueNumbers.length - 1]
      for (let i = min; i <= max; i++) {
        if (!issueNumbers.includes(i)) {
          missingIssues.push(i)
        }
      }
    }

    // Use the display name from the first comic
    const displayName = getSeriesName(sortedComics[0])

    groups.push({
      name: displayName,
      normalizedName,
      comics: sortedComics,
      issueCount: sortedComics.length,
      readCount,
      missingIssues,
      coverImage: sortedComics[0].coverImage,
    })
  }

  // Sort groups alphabetically
  return groups.sort((a, b) => a.name.localeCompare(b.name))
}

interface SeriesRowProps {
  group: SeriesGroup
  onDelete: (id: string) => void
  onUpdate?: () => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function SeriesRow({ group, onDelete, onUpdate, isExpanded, onToggleExpand }: SeriesRowProps) {
  const progress = group.issueCount > 0 ? (group.readCount / group.issueCount) * 100 : 0

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Series Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left"
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>

        {/* Cover Thumbnail */}
        <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-muted">
          {group.coverImage ? (
            <img
              src={group.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Series Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{group.name}</h3>
            {group.missingIssues.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-500" title={`Missing: #${group.missingIssues.join(', #')}`}>
                <AlertCircle className="w-3 h-3" />
                {group.missingIssues.length} missing
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {group.issueCount} {group.issueCount === 1 ? 'issue' : 'issues'}
            {group.readCount > 0 && ` · ${group.readCount} read`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex-shrink-0 w-24">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  progress >= 100 ? "bg-green-500" : progress > 0 ? "bg-primary" : "bg-transparent"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Comics Grid */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(min(120px, 100%), 1fr))",
            }}
          >
            {group.comics.map((comic) => (
              <ComicCard
                key={comic.id}
                comic={comic}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
          {group.missingIssues.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Missing issues: #{group.missingIssues.join(', #')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Collapsed row height: header with thumbnail (h-16 = 64px) + padding (p-4 = 32px)
const COLLAPSED_ROW_HEIGHT = 96

export function SeriesView({ comics, onDelete, onUpdate, onUpload }: SeriesViewProps) {
  const seriesGroups = useMemo(() => groupComicsBySeries(comics), [comics])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  // Measure scroll margin for virtualizer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measureScrollMargin = () => {
      const rect = container.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setScrollMargin(rect.top + scrollTop)
    }

    measureScrollMargin()
    window.addEventListener("resize", measureScrollMargin)
    return () => window.removeEventListener("resize", measureScrollMargin)
  }, [])

  // Virtualizer for series rows with dynamic measurement
  const virtualizer = useVirtualizer({
    count: seriesGroups.length,
    getScrollElement: useCallback(
      () => (typeof window !== "undefined" ? document.documentElement : null),
      []
    ),
    estimateSize: useCallback(
      (index) => {
        const group = seriesGroups[index]
        if (expandedGroups.has(group.normalizedName)) {
          // Estimate expanded height: header + grid rows
          // Each comic card is roughly 220px tall, grid has 120px min width
          // Assume ~6 columns on average, so rows = ceil(comics / 6)
          const estimatedRows = Math.ceil(group.comics.length / 6)
          return COLLAPSED_ROW_HEIGHT + (estimatedRows * 220) + 16 // 16px for padding
        }
        return COLLAPSED_ROW_HEIGHT
      },
      [seriesGroups, expandedGroups]
    ),
    overscan: 3,
    scrollMargin,
  })

  // Force re-measure when scrollMargin is calculated
  useLayoutEffect(() => {
    if (scrollMargin > 0) {
      virtualizer.measure()
    }
  }, [scrollMargin, virtualizer])

  const toggleExpanded = useCallback((normalizedName: string, index: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(normalizedName)) {
        next.delete(normalizedName)
      } else {
        next.add(normalizedName)
      }
      return next
    })
    // Re-measure after state update
    setTimeout(() => {
      virtualizer.measureElement(document.querySelector(`[data-index="${index}"]`) as HTMLElement)
    }, 0)
  }, [virtualizer])

  if (comics.length === 0) {
    return <LibraryEmptyState onUpload={onUpload} />
  }

  return (
    <div ref={containerRef} className="rounded-2xl border border-border overflow-hidden bg-card">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const group = seriesGroups[virtualRow.index]
          const isExpanded = expandedGroups.has(group.normalizedName)

          return (
            <div
              key={group.normalizedName}
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
              <SeriesRow
                group={group}
                onDelete={onDelete}
                onUpdate={onUpdate}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpanded(group.normalizedName, virtualRow.index)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
