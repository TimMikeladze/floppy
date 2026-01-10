"use client"

import { useReading } from "@/lib/reading-context"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer"
import { PageNavigator } from "./page-navigator"
import { BookmarksPanel } from "./bookmarks-panel"
import { NotesPanel } from "./notes-panel"
import { SettingsPanel } from "./settings-panel"
import type { Bookmark as BookmarkType } from "@/lib/types"
import { useState, useEffect } from "react"

interface ReaderMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onBookmarkClick: () => void
  comicId: string
  pages: string[]
  bookmarks: BookmarkType[]
  onRefreshBookmarks: () => void
}

export function ReaderMenu({
  open,
  onOpenChange,
  currentPage,
  totalPages,
  onPageChange,
  onBookmarkClick,
  comicId,
  pages,
  bookmarks,
  onRefreshBookmarks,
}: ReaderMenuProps) {
  const { settings } = useReading()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Check for desktop on mount and window resize
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Use bottom on mobile, respect toolbarPosition on desktop
  const drawerDirection = isDesktop ? (settings.toolbarPosition ?? "right") : "bottom"

  const isBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={drawerDirection}>
      <DrawerContent className={drawerDirection === "bottom" || drawerDirection === "top" ? "max-h-[85vh]" : ""}>
        {/* Page Scrubber - Always visible at top */}
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium tabular-nums text-muted-foreground min-w-[4rem]">
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

        {/* Quick Actions Row */}
        <div className="px-4 py-3">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 px-3 ${isBookmarked ? "text-primary" : ""}`}
              onClick={() => {
                onBookmarkClick()
              }}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
              <span className="text-xs">Bookmark</span>
            </Button>

            <PageNavigator
              pages={pages}
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page)
                onOpenChange(false)
              }}
              bookmarks={bookmarks}
              variant="menu"
            />

            <BookmarksPanel
              comicId={comicId}
              pages={pages}
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page)
                onOpenChange(false)
              }}
              onRefresh={onRefreshBookmarks}
              variant="menu"
            />

            <NotesPanel
              comicId={comicId}
              pages={pages}
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page)
                onOpenChange(false)
              }}
              variant="menu"
            />

            <SettingsPanel variant="menu" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
