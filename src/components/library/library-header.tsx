"use client"

import { Search, Upload, Moon, Sun, Settings, SortAsc, ListFilter, X, Monitor, Plus, Download, FolderUp, LayoutGrid, TableProperties, Trash2, Database } from "lucide-react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import { useState, useEffect, useRef } from "react"

type ViewMode = "grid" | "table"

interface LibraryHeaderProps {
  onUpload: () => void
  onAddComic: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: "title" | "recent" | "progress"
  onSortChange: (sort: "title" | "recent" | "progress") => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onManageLists?: () => void
  onExport?: () => void
  onImport?: (file: File) => void
  onImportDataSource?: () => void
  onClearData?: () => void
}

export function LibraryHeader({
  onUpload,
  onAddComic,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onManageLists,
  onExport,
  onImport,
  onImportDataSource,
  onClearData,
}: LibraryHeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ""
  }

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
    <header className="sticky top-0 z-40 border-b border-border/50 safe-top safe-x" style={{
      background: 'oklch(from var(--background) l c h / 0.85)',
      backdropFilter: 'blur(24px) saturate(1.2)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
      boxShadow: '0 1px 0 var(--border), 0 4px 20px oklch(0 0 0 / 0.1)'
    }}>
      <div className="flex items-center h-14 px-3 sm:px-4 md:px-6 gap-3">
        {/* Logo / Title - hidden when search is expanded on mobile */}
        {!searchExpanded && (
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">Library</h1>
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
                  className="pl-9 h-10 bg-secondary border-border/50 placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50"
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
                className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
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
                    className="w-48 lg:w-64 pl-9 h-9 bg-secondary border-border/50 placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/30"
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

              {/* View toggle */}
              <div className="hidden sm:flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-r-none ${viewMode === "grid" ? "bg-accent" : ""}`}
                  onClick={() => onViewModeChange("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-l-none ${viewMode === "table" ? "bg-accent" : ""}`}
                  onClick={() => onViewModeChange("table")}
                >
                  <TableProperties className="h-4 w-4" />
                  <span className="sr-only">Table view</span>
                </Button>
              </div>

              {/* Settings menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="touch-target">
                    <Settings className="h-5 w-5" />
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
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Library</DropdownMenuLabel>
                  {onExport && (
                    <DropdownMenuItem onClick={onExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Library
                    </DropdownMenuItem>
                  )}
                  {onImport && (
                    <DropdownMenuItem onClick={handleImportClick}>
                      <FolderUp className="mr-2 h-4 w-4" />
                      Import Library
                    </DropdownMenuItem>
                  )}
                  {onImportDataSource && (
                    <DropdownMenuItem onClick={onImportDataSource}>
                      <Database className="mr-2 h-4 w-4" />
                      Import Data Source
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
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
                  {onClearData && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setClearDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Comic button */}
              <Button
                onClick={onAddComic}
                variant="outline"
                size="sm"
                className="gap-2 ml-1 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
              </Button>

              {/* Primary action - Upload */}
              <Button
                onClick={onUpload}
                size="sm"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Clear data confirmation dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your comics, bookmarks, notes, and lists. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearData?.()
                setClearDialogOpen(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  )
}
