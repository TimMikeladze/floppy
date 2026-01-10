"use client"

import { Plus, Upload, Search, LayoutGrid, TableProperties } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileActionBarProps {
  onUpload: () => void
  onAddComic: () => void
  onSearchClick: () => void
  viewMode: "grid" | "table"
  onViewModeChange: (mode: "grid" | "table") => void
}

export function MobileActionBar({
  onUpload,
  onAddComic,
  onSearchClick,
  viewMode,
  onViewModeChange,
}: MobileActionBarProps) {
  return (
    <div className="mobile-action-bar sm:hidden fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Background with blur */}
      <div
        className="absolute inset-0 border-t border-border/50"
        style={{
          background: 'oklch(from var(--background) l c h / 0.85)',
          backdropFilter: 'blur(20px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
        }}
      />

      <div className="relative flex items-center justify-around px-4 py-2 safe-x">
        {/* Search */}
        <button
          onClick={onSearchClick}
          className="mobile-action-item"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        {/* View Toggle */}
        <button
          onClick={() => onViewModeChange(viewMode === "grid" ? "table" : "grid")}
          className="mobile-action-item"
          aria-label={viewMode === "grid" ? "Switch to table view" : "Switch to grid view"}
        >
          {viewMode === "grid" ? (
            <TableProperties className="w-5 h-5" />
          ) : (
            <LayoutGrid className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5">{viewMode === "grid" ? "List" : "Grid"}</span>
        </button>

        {/* Central FAB - Upload */}
        <div className="relative -mt-6">
          <Button
            onClick={onUpload}
            size="lg"
            className="fab-button h-14 w-14 rounded-full shadow-lg"
            aria-label="Upload comic"
          >
            <Upload className="w-6 h-6" />
          </Button>
        </div>

        {/* Add Comic */}
        <button
          onClick={onAddComic}
          className="mobile-action-item"
          aria-label="Add comic"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Add</span>
        </button>

        {/* Placeholder for symmetry - could be settings or more */}
        <div className="mobile-action-item opacity-0 pointer-events-none">
          <Plus className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </div>
      </div>
    </div>
  )
}
