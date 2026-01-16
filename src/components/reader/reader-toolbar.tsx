"use client"

import { ArrowLeft, MoreVertical, Bookmark, StickyNote, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ReaderToolbarProps {
  title: string
  isVisible: boolean
  onMenuClick: () => void
  onBookmarkClick: () => void
  onNoteClick: () => void
  isBookmarked: boolean
  isFullscreen?: boolean
  onFullscreenToggle?: () => void
}

export function ReaderToolbar({
  title,
  isVisible,
  onMenuClick,
  onBookmarkClick,
  onNoteClick,
  isBookmarked,
  isFullscreen,
  onFullscreenToggle,
}: ReaderToolbarProps) {
  return (
    <div
      className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >

      <div className="relative flex items-center gap-1 px-2 py-3 safe-top safe-x">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/20"
        >
          <Link href="/library">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to library</span>
          </Link>
        </Button>

        <h1 className="flex-1 truncate text-sm font-medium text-white drop-shadow-md px-2">
          {title}
        </h1>

        <Button
          variant="ghost"
          size="icon"
          className={`shrink-0 hover:bg-white/20 ${isBookmarked ? "text-yellow-400" : "text-white"}`}
          onClick={onBookmarkClick}
        >
          <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
          <span className="sr-only">Bookmark page</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/20"
          onClick={onNoteClick}
        >
          <StickyNote className="h-5 w-5" />
          <span className="sr-only">Add note</span>
        </Button>

        {onFullscreenToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-white hover:bg-white/20"
            onClick={onFullscreenToggle}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
            <span className="sr-only">{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-white hover:bg-white/20"
          onClick={onMenuClick}
        >
          <MoreVertical className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>
    </div>
  )
}
