"use client"

import { formatDistanceToNow } from "date-fns"
import { MoreHorizontal, Trash2, FolderPlus, Upload, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Comic } from "@/lib/types"
import Link from "next/link"
import { AddToListDialog } from "./add-to-list-dialog"
import { useState } from "react"
import { AttachFileDialog } from "./attach-file-dialog"

interface ComicCardProps {
  comic: Comic
  onDelete: (id: string) => void
  onUpdate?: () => void
  onSelect?: (comic: Comic) => void
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? current / total : 0
  const dots = 5

  return (
    <div className="progress-dots" title={`${Math.round(progress * 100)}%`}>
      {Array.from({ length: dots }).map((_, i) => {
        const dotThreshold = (i + 1) / dots
        const prevThreshold = i / dots
        const isFilled = progress >= dotThreshold
        const isPartial = progress > prevThreshold && progress < dotThreshold

        return (
          <span
            key={i}
            className={`progress-dot ${isFilled ? "filled" : ""} ${isPartial ? "partial" : ""}`}
            style={isPartial ? { "--fill-percent": `${((progress - prevThreshold) / (1 / dots)) * 100}%` } as React.CSSProperties : undefined}
          />
        )
      })}
    </div>
  )
}

function CardContextMenu({ comic, onDelete, onAttach }: { comic: Comic; onDelete: () => void; onAttach: () => void }) {
  return (
    <div
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-10"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg border-0"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 2px 8px var(--glass-shadow), 0 0 0 1px var(--glass-border)'
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {!comic.hasFile && (
            <>
              <DropdownMenuItem onClick={onAttach}>
                <Upload className="mr-2 h-4 w-4" />
                Attach File
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <AddToListDialog
            comicId={comic.id}
            comicTitle={comic.title}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FolderPlus className="mr-2 h-4 w-4" />
                Add to List
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              onDelete()
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function ComicCard({ comic, onDelete, onUpdate, onSelect }: ComicCardProps) {
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const hasProgress = comic.currentPage > 0 && comic.totalPages

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(comic)
    }
  }

  const CardInner = () => (
    <>
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted rounded-t-2xl">
        <img
          src={comic.coverImage || "/placeholder.svg"}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* No file overlay */}
        {!comic.hasFile && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-4">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">No file</span>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-3.5 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {comic.title}
        </h3>

        {comic.series && (
          <p className="text-xs text-muted-foreground truncate">
            {comic.series}
            {comic.issue && ` #${comic.issue}`}
          </p>
        )}

        {/* Progress and time */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {hasProgress ? (
            <ProgressDots current={comic.currentPage} total={comic.totalPages!} />
          ) : (
            <span className="text-xs text-muted-foreground">
              {comic.totalPages ? `${comic.totalPages} pages` : ""}
            </span>
          )}

          {comic.lastRead && (
            <span className="text-[10px] text-muted-foreground truncate">
              {formatDistanceToNow(new Date(comic.lastRead), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      <div className="comic-card group relative rounded-2xl overflow-hidden">
        {/* Context menu - outside of any interactive wrapper */}
        <CardContextMenu
          comic={comic}
          onDelete={() => onDelete(comic.id)}
          onAttach={() => setAttachDialogOpen(true)}
        />

        {/* Clickable area */}
        {comic.hasFile ? (
          onSelect ? (
            <div
              role="button"
              tabIndex={0}
              onClick={handleCardClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleCardClick()
                }
              }}
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
            >
              <CardInner />
            </div>
          ) : (
            <Link
              href={`/reader/${comic.id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
            >
              <CardInner />
            </Link>
          )
        ) : (
          <div>
            <CardInner />
          </div>
        )}
      </div>

      <AttachFileDialog
        comicId={comic.id}
        open={attachDialogOpen}
        onOpenChange={setAttachDialogOpen}
        onFileAttached={() => {
          onUpdate?.()
        }}
      />
    </>
  )
}
