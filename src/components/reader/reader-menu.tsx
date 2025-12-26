"use client"

import { useReading } from "@/lib/reading-context"
import { useTheme } from "next-themes"
import {
  Bookmark,
  StickyNote,
  Grid3X3,
  Settings2,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Scroll,
  ArrowLeftRight,
  ArrowRightLeft,
  Maximize,
  AlignVerticalJustifyCenter,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { PageNavigator } from "./page-navigator"
import { BookmarksPanel } from "./bookmarks-panel"
import { NotesPanel } from "./notes-panel"
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
  const { settings, updateSettings } = useReading()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("navigate")

  useEffect(() => {
    setMounted(true)
  }, [])

  const isBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
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
        <div className="px-4 py-3 border-b border-border">
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
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page)
                onOpenChange(false)
              }}
              variant="menu"
            />
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-auto py-0">
            <TabsTrigger
              value="navigate"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Navigate
            </TabsTrigger>
            <TabsTrigger
              value="display"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Display
            </TabsTrigger>
            <TabsTrigger
              value="reading"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3"
            >
              Reading
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <TabsContent value="navigate" className="mt-0 space-y-4">
                {/* Page Thumbnails Strip */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Pages</h3>
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2">
                      {pages.slice(0, 20).map((pageUrl, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            onPageChange(index)
                            onOpenChange(false)
                          }}
                          className={`relative shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                            currentPage === index
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-transparent hover:border-muted-foreground/30"
                          }`}
                        >
                          {pageUrl ? (
                            <img
                              src={pageUrl}
                              alt={`Page ${index + 1}`}
                              className="h-20 w-14 object-cover"
                            />
                          ) : (
                            <div className="h-20 w-14 bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">{index + 1}</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs py-0.5 text-center">
                            {index + 1}
                          </div>
                        </button>
                      ))}
                      {pages.length > 20 && (
                        <div className="shrink-0 h-20 w-14 flex items-center justify-center text-muted-foreground text-sm">
                          +{pages.length - 20}
                        </div>
                      )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="display" className="mt-0 space-y-4">
                {/* Theme */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Theme</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={mounted && theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      size="sm"
                      className="gap-2"
                    >
                      <Sun className="h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      variant={mounted && theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      size="sm"
                      className="gap-2"
                    >
                      <Moon className="h-4 w-4" />
                      Dark
                    </Button>
                    <Button
                      variant={mounted && theme === "system" ? "default" : "outline"}
                      onClick={() => setTheme("system")}
                      size="sm"
                      className="gap-2"
                    >
                      <Monitor className="h-4 w-4" />
                      Auto
                    </Button>
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Brightness</h3>
                    <span className="text-sm text-muted-foreground">{settings.brightness}%</span>
                  </div>
                  <Slider
                    value={[settings.brightness]}
                    min={30}
                    max={150}
                    step={5}
                    onValueChange={([value]) => updateSettings({ brightness: value })}
                  />
                </div>

                {/* Fit Mode */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Fit Mode</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={settings.fitMode === "fit-width" ? "default" : "outline"}
                      onClick={() => updateSettings({ fitMode: "fit-width" })}
                      size="sm"
                      className="gap-2"
                    >
                      <Maximize className="h-4 w-4" />
                      Width
                    </Button>
                    <Button
                      variant={settings.fitMode === "fit-height" ? "default" : "outline"}
                      onClick={() => updateSettings({ fitMode: "fit-height" })}
                      size="sm"
                      className="gap-2"
                    >
                      <AlignVerticalJustifyCenter className="h-4 w-4" />
                      Height
                    </Button>
                    <Button
                      variant={settings.fitMode === "original" ? "default" : "outline"}
                      onClick={() => updateSettings({ fitMode: "original" })}
                      size="sm"
                      className="gap-2"
                    >
                      <Square className="h-4 w-4" />
                      Original
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reading" className="mt-0 space-y-4">
                {/* Layout Mode */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Layout</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={settings.layoutMode === "paged" ? "default" : "outline"}
                      onClick={() => updateSettings({ layoutMode: "paged" })}
                      size="sm"
                      className="gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Paged
                    </Button>
                    <Button
                      variant={settings.layoutMode === "scrolling" ? "default" : "outline"}
                      onClick={() => updateSettings({ layoutMode: "scrolling" })}
                      size="sm"
                      className="gap-2"
                    >
                      <Scroll className="h-4 w-4" />
                      Scroll
                    </Button>
                  </div>
                </div>

                {settings.layoutMode === "paged" && (
                  <>
                    {/* Page Layout */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Pages</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={settings.pageLayout === "single" ? "default" : "outline"}
                          onClick={() => updateSettings({ pageLayout: "single" })}
                          size="sm"
                        >
                          Single
                        </Button>
                        <Button
                          variant={settings.pageLayout === "double" ? "default" : "outline"}
                          onClick={() => updateSettings({ pageLayout: "double" })}
                          size="sm"
                        >
                          Double
                        </Button>
                      </div>
                    </div>

                    {/* Reading Direction */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Direction</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={settings.readingDirection === "ltr" ? "default" : "outline"}
                          onClick={() => updateSettings({ readingDirection: "ltr" })}
                          size="sm"
                          className="gap-2"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                          Left → Right
                        </Button>
                        <Button
                          variant={settings.readingDirection === "rtl" ? "default" : "outline"}
                          onClick={() => updateSettings({ readingDirection: "rtl" })}
                          size="sm"
                          className="gap-2"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          Right → Left
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DrawerContent>
    </Drawer>
  )
}
