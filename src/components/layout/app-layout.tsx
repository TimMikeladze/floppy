"use client"

import { AppBar } from "./app-bar"
import { MobileActionBar } from "./mobile-action-bar"
import { UploadDialog } from "@/components/library/upload-dialog"
import { AddComicDialogControlled } from "@/components/library/add-comic-dialog"
import { ListManager } from "@/components/library/list-manager"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAppActions } from "@/hooks/use-app-actions"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ReactNode } from "react"
import { useState } from "react"

interface AppLayoutProps {
  // AppBar props
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: "title" | "recent" | "progress"
  onSortChange: (sort: "title" | "recent" | "progress") => void
  viewMode: "grid" | "table"
  onViewModeChange: (mode: "grid" | "table") => void

  // Callbacks
  onDataChange?: () => Promise<void>
  onListsChange?: () => Promise<void>

  // Feature flags
  releasesEnabled?: boolean

  // Layout slots
  filterPills?: ReactNode
  children: ReactNode
}

export function AppLayout({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onDataChange,
  onListsChange,
  releasesEnabled,
  filterPills,
  children,
}: AppLayoutProps) {
  const isMobile = useIsMobile()
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false)
  const {
    uploadDialogOpen,
    setUploadDialogOpen,
    addComicDialogOpen,
    setAddComicDialogOpen,
    listsSheetOpen,
    setListsSheetOpen,
    handleUploadClick,
    handleFilesSelected,
    handleExport,
    handleImport,
    handleClearData,
  } = useAppActions(onDataChange)

  // Handle mobile search click
  const handleMobileSearchClick = () => {
    setMobileSearchExpanded(true)
    // Focus search in app bar will be handled by expanding
    const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
    searchInput?.focus()
  }

  return (
    <>
      <div className="min-h-screen pb-20 sm:pb-0" style={{ background: 'var(--background)' }}>
        <AppBar
          onUpload={handleUploadClick}
          onAddComic={() => setAddComicDialogOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          onManageLists={() => setListsSheetOpen(true)}
          onExport={handleExport}
          onImport={handleImport}
          onClearData={handleClearData}
          releasesEnabled={releasesEnabled}
        />

        {/* Filter Pills Section */}
        {filterPills && (
          <div className="sticky top-14 z-30 border-b border-border/50" style={{
            background: 'oklch(from var(--background) l c h / 0.9)',
            backdropFilter: 'blur(20px) saturate(1.1)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.1)'
          }}>
            {filterPills}
          </div>
        )}

        {/* Main Content */}
        <main className="px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 mx-auto w-full max-w-screen-2xl">
          {children}
        </main>
      </div>

      {/* Mobile Action Bar */}
      <MobileActionBar
        onUpload={handleUploadClick}
        onAddComic={() => setAddComicDialogOpen(true)}
        onSearchClick={handleMobileSearchClick}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {/* Shared Dialogs */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onFilesSelected={handleFilesSelected}
      />

      <AddComicDialogControlled
        open={addComicDialogOpen}
        onOpenChange={setAddComicDialogOpen}
        onComicAdded={() => onDataChange?.()}
      />

      <Dialog open={listsSheetOpen} onOpenChange={setListsSheetOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Lists</DialogTitle>
            <DialogDescription>Create and organize your comic lists</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <ListManager onListsChange={onListsChange} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
