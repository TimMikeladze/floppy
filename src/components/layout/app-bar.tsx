"use client"

import { Search, Upload, Moon, Sun, Settings, SortAsc, ListFilter, X, Monitor, Plus, Download, FolderUp, LayoutGrid, TableProperties, Trash2, Database, Library, Sparkles, Info, HardDrive, Layers, Heart } from "lucide-react"
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
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SupportDialog } from "./support-dialog"

type ViewMode = "grid" | "table" | "series"

interface AppBarProps {
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
  releasesEnabled?: boolean
}

export function AppBar({
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
  releasesEnabled = false,
}: AppBarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [supportDialogOpen, setSupportDialogOpen] = useState(false)
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

  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="safe-top safe-x bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
      <div className="flex items-center h-14 px-4 sm:px-6 md:px-8 gap-2 sm:gap-3 mx-auto w-full max-w-screen-2xl safe-x">
        {/* Logo / Title - hidden when search is expanded on mobile */}
        {!searchExpanded && (
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                pathname === '/' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Library className="h-4 w-4" />
              <span className="hidden sm:inline">Library</span>
            </Link>
            {releasesEnabled && (
              <Link
                href="/releases"
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                  pathname === '/releases' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Releases</span>
              </Link>
            )}
          </div>
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
                  <Button variant="ghost" size="icon" className="h-9">
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
                  className={`h-9 w-9 rounded-r-none ${viewMode === "grid" ? "bg-accent" : ""}`}
                  onClick={() => onViewModeChange("grid")}
                  title="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-none border-x ${viewMode === "series" ? "bg-accent" : ""}`}
                  onClick={() => onViewModeChange("series")}
                  title="Series view"
                >
                  <Layers className="h-4 w-4" />
                  <span className="sr-only">Series view</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 rounded-l-none ${viewMode === "table" ? "bg-accent" : ""}`}
                  onClick={() => onViewModeChange("table")}
                  title="Table view"
                >
                  <TableProperties className="h-4 w-4" />
                  <span className="sr-only">Table view</span>
                </Button>
              </div>

              {/* Add Comic button */}
              <Button
                onClick={onAddComic}
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:w-auto sm:px-3 bg-transparent"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Add</span>
              </Button>

              {/* Upload button */}
              <Button
                onClick={onUpload}
                variant="outline"
                size="icon"
                className="h-9 w-9 sm:w-auto sm:px-3 bg-transparent"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline sm:ml-2">Upload</span>
              </Button>

              {/* Settings menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3 bg-transparent">
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline sm:ml-2">Settings</span>
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
                  <DropdownMenuSeparator />
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <HardDrive className="mr-2 h-4 w-4" />
                      Manage Storage
                    </DropdownMenuItem>
                  </Link>
                  {onClearData && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setClearDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Data
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <Link href="/about">
                    <DropdownMenuItem>
                      <Info className="mr-2 h-4 w-4" />
                      About
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={() => setSupportDialogOpen(true)}>
                    <Heart className="mr-2 h-4 w-4" />
                    Support
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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

      <SupportDialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen} />
    </header>
  )
}
