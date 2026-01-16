"use client"

import { ArrowLeft, Settings, BookmarkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { PageNavigator } from "./page-navigator"
import { BookmarksPanel } from "./bookmarks-panel"
import { NotesPanel } from "./notes-panel"
import type { Bookmark } from "@/lib/types"

interface ReaderControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onSettingsClick: () => void
  onBookmarkClick: () => void
  title: string
  isVisible: boolean
  comicId: string
  pages: string[]
  bookmarks: Bookmark[]
  onRefreshBookmarks: () => void
}

export function ReaderControls({
  currentPage,
  totalPages,
  onPageChange,
  onSettingsClick,
  onBookmarkClick,
  title,
  isVisible,
  comicId,
  pages,
  bookmarks,
  onRefreshBookmarks,
}: ReaderControlsProps) {
  return (
    <>
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3" style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderBottom: '1px solid var(--glass-border)',
        boxShadow: '0 1px 3px var(--glass-shadow)'
      }}>
        <Button asChild variant="ghost" size="icon">
          <Link href="/library">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to library</span>
          </Link>
        </Button>
        <h1 className="flex-1 truncate text-sm font-semibold md:text-base">{title}</h1>

        <div className="flex items-center gap-1">
          <PageNavigator pages={pages} currentPage={currentPage} onPageSelect={onPageChange} bookmarks={bookmarks} />

          <BookmarksPanel
            comicId={comicId}
            pages={pages}
            currentPage={currentPage}
            onPageSelect={onPageChange}
            onRefresh={onRefreshBookmarks}
          />

          <NotesPanel comicId={comicId} pages={pages} currentPage={currentPage} onPageSelect={onPageChange} />

          <Button variant="ghost" size="icon" onClick={onBookmarkClick}>
            <BookmarkIcon className="h-5 w-5" />
            <span className="sr-only">Bookmark page</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={onSettingsClick}>
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-20 border-t transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
          borderColor: 'var(--glass-border)',
          boxShadow: '0 -1px 3px var(--glass-shadow)'
        }}
      >
        <div className="px-4 py-4">
          <div className="mx-auto flex max-w-3xl items-center gap-4">
            <span className="text-sm font-medium tabular-nums">
              {currentPage + 1} / {totalPages}
            </span>
            <Slider
              value={[currentPage]}
              min={0}
              max={totalPages - 1}
              step={1}
              onValueChange={([value]) => onPageChange(value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </>
  )
}
