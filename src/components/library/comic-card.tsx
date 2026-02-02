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
  ChevronRight,
  Check,
  Plus,
  Image,
  Download,
  CloudOff,
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
import { useState, useEffect, useCallback } from "react"
import { AttachFileDialog } from "./attach-file-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { EditComicDialog } from "./edit-comic-dialog"
import { CoverManager, MissingCoverIndicator } from "./cover-manager"
import { loadRemoteImage, revokeRemoteImage } from "@/lib/remote-loader"
import { saveComic, getOfflineStatus, saveComicForOffline, removeOfflineCache, type OfflineStatus } from "@/lib/storage"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useConfirmDelete } from "@/lib/use-confirm-delete"

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

interface QuickActionsProps {
  comic: Comic
  onUpdate: () => void
  onOpenAddToList: () => void
}

function QuickActions({ comic, onUpdate, onOpenAddToList }: QuickActionsProps) {
  const router = useRouter()
  const isComplete = comic.totalPages && comic.currentPage >= comic.totalPages
  const canRead = comic.hasFile || comic.sourceType === 'remote'

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
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

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onOpenAddToList()
  }

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/reader/${comic.id}`)
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 hidden [@media(hover:hover)]:flex"
      style={{
        background: 'linear-gradient(to top, oklch(0 0 0 / 0.7) 0%, transparent 100%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mark as read button */}
      {comic.totalPages && !isComplete && (
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
          onClick={handleMarkAsRead}
          title="Mark as read"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}

      {/* Add to list button */}
      <Button
        variant="secondary"
        size="icon"
        className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
        onClick={handleAddToList}
        title="Add to list"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Continue reading button */}
      {canRead && (
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
          onClick={handleContinue}
          title="Continue reading"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

interface CardContextMenuProps {
  comic: Comic
  onDelete: () => void
  onAttach: () => void
  onEdit: () => void
  onUpdate: () => void
  onManageCover: () => void
  offlineStatus: OfflineStatus | null
  onOfflineStatusChange: () => void
}

function CardContextMenu({ comic, onDelete, onAttach, onEdit, onUpdate, onManageCover, offlineStatus, onOfflineStatusChange }: CardContextMenuProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const handleDelete = useConfirmDelete(onDelete)
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

  const handleSaveForOffline = async () => {
    if (saving) return
    setSaving(true)
    toast.info("Saving for offline...")

    try {
      const success = await saveComicForOffline(comic.id, (prog) => {
        if (prog.status === "complete") {
          toast.success("Saved for offline")
          onOfflineStatusChange()
          setSaving(false)
        } else if (prog.status === "error") {
          toast.error(prog.error || "Failed to save for offline")
          setSaving(false)
        }
      })

      if (!success) {
        setSaving(false)
      }
    } catch (error) {
      console.error("Failed to save for offline:", error)
      toast.error("Failed to save for offline")
      setSaving(false)
    }
  }

  const handleRemoveOffline = async () => {
    try {
      await removeOfflineCache(comic.id)
      toast.success("Offline cache removed")
      onOfflineStatusChange()
    } catch (error) {
      console.error("Failed to remove offline cache:", error)
      toast.error("Failed to remove offline cache")
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

          {/* Manage cover */}
          <DropdownMenuItem onClick={onManageCover}>
            <Image className="mr-2 h-4 w-4" />
            Manage Cover
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

          {/* Offline actions */}
          {canRead && (
            <>
              {offlineStatus?.isAvailableOffline ? (
                <DropdownMenuItem onClick={handleRemoveOffline}>
                  <CloudOff className="mr-2 h-4 w-4" />
                  Remove Offline Cache
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleSaveForOffline} disabled={saving}>
                  <Download className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save for Offline"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
            </>
          )}

          {/* Delete */}
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
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

interface MobileActionsSheetProps {
  comic: Comic
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  onEdit: () => void
  onManageCover: () => void
  onAddToList: () => void
  onUpdate: () => void
  offlineStatus: OfflineStatus | null
  onOfflineStatusChange: () => void
}

function MobileActionsSheet({
  comic,
  open,
  onOpenChange,
  onDelete,
  onEdit,
  onManageCover,
  onAddToList,
  onUpdate,
  offlineStatus,
  onOfflineStatusChange,
}: MobileActionsSheetProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const handleDelete = useConfirmDelete(() => {
    onDelete()
    onOpenChange(false)
  })
  const isRemote = comic.sourceType === 'remote'
  const canRead = comic.hasFile || isRemote
  const hasProgress = comic.currentPage > 0
  const isComplete = comic.totalPages && comic.currentPage >= comic.totalPages

  const handleAction = (action: () => void) => {
    action()
    onOpenChange(false)
  }

  const handleSaveForOffline = async () => {
    if (saving) return
    setSaving(true)
    toast.info("Saving for offline...")

    try {
      const success = await saveComicForOffline(comic.id, (prog) => {
        if (prog.status === "complete") {
          toast.success("Saved for offline")
          onOfflineStatusChange()
          setSaving(false)
          onOpenChange(false)
        } else if (prog.status === "error") {
          toast.error(prog.error || "Failed to save for offline")
          setSaving(false)
        }
      })

      if (!success) {
        setSaving(false)
      }
    } catch (error) {
      console.error("Failed to save for offline:", error)
      toast.error("Failed to save for offline")
      setSaving(false)
    }
  }

  const handleRemoveOffline = async () => {
    try {
      await removeOfflineCache(comic.id)
      toast.success("Offline cache removed")
      onOfflineStatusChange()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to remove offline cache:", error)
      toast.error("Failed to remove offline cache")
    }
  }

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
      onOpenChange(false)
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
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to mark as unread:", error)
      toast.error("Failed to mark as unread")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-left line-clamp-1">{comic.title}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-1 pb-4">
          {canRead && (
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              onClick={() => handleAction(() => router.push(`/reader/${comic.id}`))}
            >
              <ChevronRight className="mr-3 h-5 w-5" />
              Open
            </Button>
          )}

          {comic.totalPages && !isComplete && (
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              onClick={handleMarkAsRead}
            >
              <Check className="mr-3 h-5 w-5" />
              Mark as Read
            </Button>
          )}

          {hasProgress && (
            <Button
              variant="ghost"
              className="w-full justify-start h-12 text-base"
              onClick={handleMarkAsUnread}
            >
              <RotateCcw className="mr-3 h-5 w-5" />
              Mark as Unread
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base"
            onClick={() => handleAction(onAddToList)}
          >
            <Plus className="mr-3 h-5 w-5" />
            Add to List
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base"
            onClick={() => handleAction(onEdit)}
          >
            <Pencil className="mr-3 h-5 w-5" />
            Edit Details
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base"
            onClick={() => handleAction(onManageCover)}
          >
            <Image className="mr-3 h-5 w-5" />
            Manage Cover
          </Button>

          {/* Offline actions */}
          {canRead && (
            offlineStatus?.isAvailableOffline ? (
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base"
                onClick={handleRemoveOffline}
              >
                <CloudOff className="mr-3 h-5 w-5" />
                Remove Offline Cache
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start h-12 text-base"
                onClick={handleSaveForOffline}
                disabled={saving}
              >
                <Download className="mr-3 h-5 w-5" />
                {saving ? "Saving..." : "Save for Offline"}
              </Button>
            )
          )}

          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-3 h-5 w-5" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function ComicCard({ comic, onDelete, onUpdate, onSelect }: ComicCardProps) {
  const [attachDialogOpen, setAttachDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addToListDialogOpen, setAddToListDialogOpen] = useState(false)
  const [coverManagerOpen, setCoverManagerOpen] = useState(false)
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false)
  const [remoteCoverUrl, setRemoteCoverUrl] = useState<string | null>(null)
  const [coverLoading, setCoverLoading] = useState(false)
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null)
  const hasProgress = comic.currentPage > 0 && comic.totalPages
  const isRemote = comic.sourceType === 'remote'
  const hasCover = !!comic.coverImage || !!remoteCoverUrl

  // Check offline status
  const refreshOfflineStatus = useCallback(async () => {
    try {
      const status = await getOfflineStatus(comic.id)
      setOfflineStatus(status)
    } catch (error) {
      console.error("[comic-card] Failed to get offline status:", error)
    }
  }, [comic.id])

  useEffect(() => {
    refreshOfflineStatus()
  }, [refreshOfflineStatus])

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


        {/* Missing cover indicator */}
        {!hasCover && !coverLoading && !isRemote && (
          <MissingCoverIndicator onClick={() => setCoverManagerOpen(true)} />
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

        {/* Quick Actions */}
        <QuickActions
          comic={comic}
          onUpdate={() => onUpdate?.()}
          onOpenAddToList={() => setAddToListDialogOpen(true)}
        />
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
        {/* Context menu - only visible on desktop (hover devices) */}
        <div className="hidden [@media(hover:hover)]:block">
          <CardContextMenu
            comic={comic}
            onDelete={() => onDelete(comic.id)}
            onAttach={() => setAttachDialogOpen(true)}
            onEdit={() => setEditDialogOpen(true)}
            onUpdate={() => onUpdate?.()}
            onManageCover={() => setCoverManagerOpen(true)}
            offlineStatus={offlineStatus}
            onOfflineStatusChange={refreshOfflineStatus}
          />
        </div>

        {/* Mobile tap target - only visible on touch devices */}
        <button
          type="button"
          onClick={() => setMobileActionsOpen(true)}
          className="absolute inset-0 z-10 hidden [@media(hover:none)]:block"
          aria-label={`Actions for ${comic.title}`}
        />

        {/* Clickable area - local comics with files OR remote comics can be read */}
        {/* On desktop: clicking navigates to reader. On mobile: tap target above handles it */}
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
              className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl [@media(hover:none)]:pointer-events-none"
            >
              <CardInner />
            </div>
          ) : (
            <Link
              href={`/reader/${comic.id}`}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl [@media(hover:none)]:pointer-events-none"
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

      <EditComicDialog
        comic={comic}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={() => {
          onUpdate?.()
        }}
      />

      <AddToListDialog
        comicId={comic.id}
        comicTitle={comic.title}
        open={addToListDialogOpen}
        onOpenChange={setAddToListDialogOpen}
      />

      <CoverManager
        comic={comic}
        open={coverManagerOpen}
        onOpenChange={setCoverManagerOpen}
        onCoverChange={() => onUpdate?.()}
      />

      <MobileActionsSheet
        comic={comic}
        open={mobileActionsOpen}
        onOpenChange={setMobileActionsOpen}
        onDelete={() => onDelete(comic.id)}
        onEdit={() => setEditDialogOpen(true)}
        onManageCover={() => setCoverManagerOpen(true)}
        onAddToList={() => setAddToListDialogOpen(true)}
        onUpdate={() => onUpdate?.()}
        offlineStatus={offlineStatus}
        onOfflineStatusChange={refreshOfflineStatus}
      />
    </>
  )
}
