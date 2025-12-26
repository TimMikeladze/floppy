"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LayoutGrid } from "lucide-react"
import type { Bookmark } from "@/lib/types"

interface PageNavigatorProps {
  pages: string[]
  currentPage: number
  onPageSelect: (page: number) => void
  bookmarks?: Bookmark[]
  variant?: "icon" | "menu"
}

export function PageNavigator({ pages, currentPage, onPageSelect, bookmarks = [], variant = "icon" }: PageNavigatorProps) {
  const [open, setOpen] = useState(false)
  const bookmarkedPages = new Set(bookmarks.map((b) => b.pageNumber))

  const trigger = variant === "menu" ? (
    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-3">
      <LayoutGrid className="h-5 w-5" />
      <span className="text-xs">Pages</span>
    </Button>
  ) : (
    <Button variant="ghost" size="icon">
      <LayoutGrid className="h-5 w-5" />
      <span className="sr-only">Page navigator</span>
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Pages</SheetTitle>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-8rem)]">
          <div className="grid grid-cols-3 gap-3">
            {pages.map((pageUrl, index) => (
              <button
                key={index}
                onClick={() => {
                  onPageSelect(index)
                  setOpen(false)
                }}
                className={`group relative aspect-[2/3] overflow-hidden rounded-md border-2 transition-all ${
                  index === currentPage
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-transparent hover:border-muted-foreground"
                }`}
              >
                <img
                  src={pageUrl || "/placeholder.svg"}
                  alt={`Page ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent px-2 py-1">
                  <span className="text-xs font-medium text-foreground">{index + 1}</span>
                </div>
                {bookmarkedPages.has(index) && (
                  <div className="absolute right-1 top-1 rounded-full bg-primary p-1">
                    <svg className="h-3 w-3 text-primary-foreground" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2z" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
