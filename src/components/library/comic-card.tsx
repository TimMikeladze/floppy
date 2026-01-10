"use client"

import { formatDistanceToNow } from "date-fns"
import {
  MoreHorizontal,
  Trash2,
  FolderPlus,
  Upload,
  BookOpen,
  Globe,
  Pencil,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
} from "lucide-react"
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
import { useState, useEffect, useRef, useCallback } from "react"
import { AttachFileDialog } from "./attach-file-dialog"
import { EditComicDialog } from "./edit-comic-dialog"
import { loadRemoteImage, revokeRemoteImage } from "@/lib/remote-loader"
import { saveComic } from "@/lib/storage"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  MobileActionSheet,
  ActionSheetItem,
  ActionSheetSeparator,
  ActionSheetLabel,
} from "@/components/ui/mobile-action-sheet"

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

interface CardContextMenuProps {
  comic: Comic
  onDelete: () => void
  onAttach: () => void
  onEdit: () => void
  onUpdate: () => void
}

function CardContextMenu({ comic, onDelete, onAttach, onEdit, onUpdate }: CardContextMenuProps) {
  const router = useRouter()
  const isRemote = comic.sourceType === 'remote'
  const canRead = comic.hasFile || isRemote
  const hasProgress = comic.currentPage > 0
  const isComplete = comic.totalPages && comic.currentPage >= comic.totalPages

  const handleMarkAsRead = async () => {
    if (!comic.totalPages) {
      toast.error("Cannot mark as read: page count unknown")
      return
    }
    try {
      await saveComic({
        ...comic,
        currentPage: comic.totalPages,
        lastRead: new Date(),
      })
      toast.success("Marked as read")
      onUpdate()
    } catch (error) {
      console.error("Failed to mark as read:", error)
      toast.error("Failed to mark as read")
    }
  }

  const handleMarkAsUnread = async () => {
    try {
      await saveComic({
        ...comic,
        currentPage: 0,
        lastRead: undefined,
      })
      toast.success("Marked as unread")
      onUpdate()
    } catch (error) {
      console.error("Failed to mark as unread:", error)
      toast.error("Failed to mark as unread")
    }
  }

  const handleResetProgress = async () => {
    try {
      await saveComic({
        ...comic,
        currentPage: 0,
      })
      toast.success("Progress reset")
      onUpdate()
    } catch (error) {
      console.error("Failed to reset progress:", error)
      toast.error("Failed to reset progress")
    }
  }

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
        <DropdownMenuContent align="end" className="w-48">
          {/* Open in reader */}
          {canRead && (
            <>
              <DropdownMenuItem onClick={() => router.push(`/reader/${comic.id}`)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Edit details */}
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Details
          </DropdownMenuItem>

          {/* Reading progress actions */}
          {comic.totalPages && !isComplete && (
            <DropdownMenuItem onClick={handleMarkAsRead}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Read
            </DropdownMenuItem>
          )}
          {hasProgress && (
            <DropdownMenuItem onClick={handleMarkAsUnread}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Mark as Unread
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* File attachment for local comics without files */}
          {!comic.hasFile && !isRemote && (
            <DropdownMenuItem onClick={onAttach}>
              <Upload className="mr-2 h-4 w-4" />
              Attach File
            </DropdownMenuItem>
          )}

          {/* Add to list */}
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

          {/* Delete */}
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
  const router = useRouter()
  const isMobile = useIsMobile()
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [mobileActionSheetOpen, setMobileActionSheetOpen] = useState(false)
  const [addToListDialogOpen, setAddToListDialogOpen] = useState(false)
  const [remoteCoverUrl, setRemoteCoverUrl] = useState<string | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasProgress = comic.currentPage > 0 && comic.totalPages
  const isRemote = comic.sourceType === 'remote'
  const canRead = comic.hasFile || isRemote
  const isComplete = comic.totalPages && comic.currentPage >= comic.totalPages

  // Long press handling for mobile
  const handleTouchStart = useCallback(() => {
    if (!isMobile) return
    setIsPressed(true)
    longPressTimerRef.current = setTimeout(() => {
      setMobileActionSheetOpen(true)
      setIsPressed(false)
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
    }, 500)
  }, [isMobile])

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const handleTouchMove = useCallback(() => {
    setIsPressed(false)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  // Load remote cover on demand
  useEffect(() => {
    if (!isRemote || !comic.coverUrl || comic.coverImage) return

    let cancelled = false
    setCoverLoading(true)

    loadRemoteImage(comic.coverUrl)
      .then(url => {
        if (!cancelled) {
          setRemoteCoverUrl(url)
          setCoverLoading(false)
        }
      })
      .catch(err => {
        console.error('[comic-card] Failed to load remote cover:', err)
        if (!cancelled) {
          setCoverLoading(false)
        }
      })

    return () => {
      cancelled = true
      if (remoteCoverUrl) {
        revokeRemoteImage(comic.coverUrl!)
      }
    }
  }, [isRemote, comic.coverUrl, comic.coverImage])

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(comic)
    }
  }

  // Mobile action handlers
  const handleMarkAsRead = async () => {
    if (!comic.totalPages) {
      toast.error("Cannot mark as read: page count unknown")
      return
    }
    try {
      await saveComic({
        ...comic,
        currentPage: comic.totalPages,
        lastRead: new Date(),
      })
      toast.success("Marked as read")
      onUpdate?.()
    } catch (error) {
      console.error("Failed to mark as read:", error)
      toast.error("Failed to mark as read")
    }
    setMobileActionSheetOpen(false)
  }

  const handleMarkAsUnread = async () => {
    try {
      await saveComic({
        ...comic,
        currentPage: 0,
        lastRead: undefined,
      })
      toast.success("Marked as unread")
      onUpdate?.()
    } catch (error) {
      console.error("Failed to mark as unread:", error)
      toast.error("Failed to mark as unread")
    }
    setMobileActionSheetOpen(false)
  }

  // Determine the cover image to display
  const displayCover = comic.coverImage || remoteCoverUrl || "/placeholder.svg"

  const CardInner = () => (
    <>
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted rounded-t-2xl">
        {coverLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <img
            src={displayCover}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        {/* Remote indicator */}
        {isRemote && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
            <Globe className="h-3 w-3 text-white" />
          </div>
        )}

        {/* No file overlay - only for local comics without files */}
        {!comic.hasFile && !isRemote && (
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
      <div
        className={`comic-card group relative rounded-2xl overflow-hidden ${isPressed ? 'pressing' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => {
          if (isMobile) {
            e.preventDefault()
            setMobileActionSheetOpen(true)
          }
        }}
      >
        {/* Context menu - desktop only, hidden on mobile */}
        {!isMobile && (
          <CardContextMenu
            comic={comic}
            onDelete={() => onDelete(comic.id)}
            onAttach={() => setAttachDialogOpen(true)}
            onEdit={() => setEditDialogOpen(true)}
            onUpdate={() => onUpdate?.()}
          />
        )}

        {/* Clickable area - local comics with files OR remote comics can be read */}
        {(comic.hasFile || isRemote) ? (
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

      {/* Mobile Action Sheet */}
      <MobileActionSheet
        open={mobileActionSheetOpen}
        onOpenChange={setMobileActionSheetOpen}
        title={comic.title}
      >
        {/* Cover preview */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={displayCover}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{comic.title}</p>
            {comic.series && (
              <p className="text-xs text-muted-foreground truncate">
                {comic.series}{comic.issue && ` #${comic.issue}`}
              </p>
            )}
            {comic.totalPages && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {comic.currentPage} / {comic.totalPages} pages
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {canRead && (
          <>
            <ActionSheetItem
              icon={<ExternalLink className="w-5 h-5" />}
              onClick={() => {
                setMobileActionSheetOpen(false)
                router.push(`/reader/${comic.id}`)
              }}
            >
              Open
            </ActionSheetItem>
            <ActionSheetSeparator />
          </>
        )}

        <ActionSheetItem
          icon={<Pencil className="w-5 h-5" />}
          onClick={() => {
            setMobileActionSheetOpen(false)
            setEditDialogOpen(true)
          }}
        >
          Edit Details
        </ActionSheetItem>

        {comic.totalPages && !isComplete && (
          <ActionSheetItem
            icon={<CheckCircle2 className="w-5 h-5" />}
            onClick={handleMarkAsRead}
          >
            Mark as Read
          </ActionSheetItem>
        )}

        {hasProgress && (
          <ActionSheetItem
            icon={<RotateCcw className="w-5 h-5" />}
            onClick={handleMarkAsUnread}
          >
            Mark as Unread
          </ActionSheetItem>
        )}

        <ActionSheetSeparator />

        {!comic.hasFile && !isRemote && (
          <ActionSheetItem
            icon={<Upload className="w-5 h-5" />}
            onClick={() => {
              setMobileActionSheetOpen(false)
              setAttachDialogOpen(true)
            }}
          >
            Attach File
          </ActionSheetItem>
        )}

        <ActionSheetItem
          icon={<FolderPlus className="w-5 h-5" />}
          onClick={() => {
            setMobileActionSheetOpen(false)
            setAddToListDialogOpen(true)
          }}
        >
          Add to List
        </ActionSheetItem>

        <ActionSheetSeparator />

        <ActionSheetItem
          icon={<Trash2 className="w-5 h-5" />}
          variant="destructive"
          onClick={() => {
            setMobileActionSheetOpen(false)
            onDelete(comic.id)
          }}
        >
          Delete
        </ActionSheetItem>
      </MobileActionSheet>

      {/* Add to List Dialog */}
      <AddToListDialog
        comicId={comic.id}
        comicTitle={comic.title}
        open={addToListDialogOpen}
        onOpenChange={setAddToListDialogOpen}
      />

      <AttachFileDialog
        comicId={comic.id}
        open={attachDialogOpen}
        onOpenChange={setAttachDialogOpen}
        onFileAttached={() => {
          onUpdate?.()
        }}
      />

      <EditComicDialog
        comic={comic}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={() => {
          onUpdate?.()
        }}
      />
    </>
  )
}
