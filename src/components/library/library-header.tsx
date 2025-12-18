"use client"

import { Search, Upload, Moon, Sun, Menu, SortAsc, ListFilter, X, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"

interface LibraryHeaderProps {
  onUpload: () => void
  onAddComic: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: "title" | "recent" | "progress"
  onSortChange: (sort: "title" | "recent" | "progress") => void
  onManageLists?: () => void
}

export function LibraryHeader({
  onUpload,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onManageLists,
}: LibraryHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sortLabels = {
    title: "Title",
    recent: "Recent",
    progress: "Progress",
  }

  const ThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4" />
    if (theme === "system") return <Monitor className="h-4 w-4" />
    return resolvedTheme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Logo / Title - hidden when search is expanded on mobile */}
        {!searchExpanded && (
          <h1 className="text-lg font-semibold tracking-tight">Library</h1>
        )}

        {/* Search - expandable on mobile */}
        <div className={`flex-1 flex items-center ${searchExpanded ? "" : "justify-end"}`}>
          {searchExpanded ? (
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search comics..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 h-10 bg-secondary/50 border-0 focus-visible:ring-1"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchExpanded(false)
                  onSearchChange("")
                }}
                className="shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Search on desktop, icon on mobile */}
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-48 lg:w-64 pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchExpanded(true)}
                className="sm:hidden touch-target"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-target">
                    <SortAsc className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
                  {(["recent", "title", "progress"] as const).map((sort) => (
                    <DropdownMenuItem
                      key={sort}
                      onClick={() => onSortChange(sort)}
                      className={sortBy === sort ? "bg-accent" : ""}
                    >
                      {sortLabels[sort]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-target">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onManageLists && (
                    <>
                      <DropdownMenuItem onClick={onManageLists}>
                        <ListFilter className="mr-2 h-4 w-4" />
                        Manage Lists
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Theme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                    {mounted && theme === "light" && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                    {mounted && theme === "dark" && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                    {mounted && theme === "system" && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Primary action - Upload */}
              <Button onClick={onUpload} size="sm" className="gap-2 ml-1">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
