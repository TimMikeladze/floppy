"use client"

import { BookOpen, Upload, FileArchive, FileText, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LibraryEmptyStateProps {
  onUpload?: () => void
}

export function LibraryEmptyState({ onUpload }: LibraryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
      {/* Decorative background glow */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)'
        }}
      />

      {/* Icon container with gradient border */}
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
        style={{
          background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
          boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)'
        }}
      >
        <BookOpen className="w-12 h-12 text-primary" strokeWidth={1.5} />
      </div>

      <h2 className="text-2xl font-bold mb-3 text-foreground">Welcome to your library</h2>
      <p className="text-muted-foreground text-base max-w-md mb-6 leading-relaxed">
        Your comic collection lives here. Upload comics to start reading with progress tracking, bookmarks, and notes.
      </p>

      {/* Supported formats */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <FileArchive className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">CBZ</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <FileArchive className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">CBR</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <FileText className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">PDF</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <FolderOpen className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Folders</span>
        </div>
      </div>

      <p className="text-muted-foreground/70 text-xs max-w-sm mb-8 leading-relaxed">
        All comics are stored locally on your device. Sync via iCloud, Google Drive, or other cloud storage.
      </p>

      {onUpload && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            onClick={onUpload}
            size="lg"
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 px-8"
          >
            <Upload className="w-5 h-5" />
            Upload Comics
          </Button>
        </div>
      )}
    </div>
  )
}
