"use client"

import * as React from "react"
import { Download, CheckCircle2, Loader2, CloudOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { getOfflineStatus, type OfflineStatus } from "@/lib/storage"

interface OfflineIndicatorProps {
  comicId: string
  className?: string
  showLabel?: boolean
  size?: "sm" | "md"
}

export function OfflineIndicator({
  comicId,
  className,
  showLabel = false,
  size = "sm",
}: OfflineIndicatorProps) {
  const [status, setStatus] = React.useState<OfflineStatus | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function checkStatus() {
      try {
        const offlineStatus = await getOfflineStatus(comicId)
        if (!cancelled) {
          setStatus(offlineStatus)
          setLoading(false)
        }
      } catch (error) {
        console.error("[offline-indicator] Error checking status:", error)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkStatus()

    return () => {
      cancelled = true
    }
  }, [comicId])

  if (loading || !status) {
    return null
  }

  // Don't show anything if not available offline
  if (!status.isAvailableOffline) {
    return null
  }

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
  const containerSize = size === "sm" ? "p-1" : "p-1.5"

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-green-500/90 backdrop-blur-sm rounded-full text-white",
        containerSize,
        className
      )}
      title="Available offline"
    >
      <CheckCircle2 className={iconSize} />
      {showLabel && (
        <span className="text-xs font-medium pr-1">Offline</span>
      )}
    </div>
  )
}

interface OfflineStatusBadgeProps {
  status: OfflineStatus
  className?: string
}

export function OfflineStatusBadge({ status, className }: OfflineStatusBadgeProps) {
  if (status.isAvailableOffline) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-green-600 dark:text-green-400",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">Available offline</span>
      </div>
    )
  }

  if (status.cachedPageCount > 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-amber-600 dark:text-amber-400",
          className
        )}
      >
        <CloudOff className="h-4 w-4" />
        <span className="text-sm">
          {status.percentCached}% cached ({status.cachedPageCount}/{status.totalPageCount} pages)
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-muted-foreground",
        className
      )}
    >
      <Download className="h-4 w-4" />
      <span className="text-sm">Not saved for offline</span>
    </div>
  )
}

interface SaveForOfflineButtonProps {
  comicId: string
  onSaveComplete?: () => void
  variant?: "icon" | "full"
  className?: string
}

export function SaveForOfflineButton({
  comicId,
  onSaveComplete,
  variant = "icon",
  className,
}: SaveForOfflineButtonProps) {
  const [status, setStatus] = React.useState<OfflineStatus | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [progress, setProgress] = React.useState({ current: 0, total: 0 })

  React.useEffect(() => {
    let cancelled = false

    async function checkStatus() {
      const offlineStatus = await getOfflineStatus(comicId)
      if (!cancelled) {
        setStatus(offlineStatus)
      }
    }

    checkStatus()

    return () => {
      cancelled = true
    }
  }, [comicId])

  const handleSave = async () => {
    if (saving) return

    setSaving(true)
    setProgress({ current: 0, total: 0 })

    try {
      const { saveComicForOffline } = await import("@/lib/storage")

      const success = await saveComicForOffline(comicId, (prog) => {
        setProgress({ current: prog.currentPage, total: prog.totalPages })

        if (prog.status === "complete") {
          setSaving(false)
          // Refresh status
          getOfflineStatus(comicId).then(setStatus)
          onSaveComplete?.()
        } else if (prog.status === "error") {
          setSaving(false)
          console.error("[save-offline] Error:", prog.error)
        }
      })

      if (!success) {
        setSaving(false)
      }
    } catch (error) {
      console.error("[save-offline] Failed:", error)
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    try {
      const { removeOfflineCache } = await import("@/lib/storage")
      await removeOfflineCache(comicId)
      const newStatus = await getOfflineStatus(comicId)
      setStatus(newStatus)
      onSaveComplete?.()
    } catch (error) {
      console.error("[remove-offline] Failed:", error)
    }
  }

  if (!status) {
    return null
  }

  // Already available offline - show remove option
  if (status.isAvailableOffline) {
    if (variant === "icon") {
      return (
        <button
          type="button"
          onClick={handleRemove}
          className={cn(
            "flex items-center justify-center p-1.5 rounded-full bg-green-500/90 text-white hover:bg-green-600/90 transition-colors",
            className
          )}
          title="Remove offline cache"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={handleRemove}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50 rounded-md transition-colors w-full",
          className
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>Saved offline</span>
      </button>
    )
  }

  // Saving in progress
  if (saving) {
    const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

    if (variant === "icon") {
      return (
        <div
          className={cn(
            "flex items-center justify-center p-1.5 rounded-full bg-blue-500/90 text-white",
            className
          )}
          title={`Saving: ${percent}%`}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )
    }

    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving... {percent}%</span>
      </div>
    )
  }

  // Not saved - show save option
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleSave}
        className={cn(
          "flex items-center justify-center p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors",
          className
        )}
        title="Save for offline"
      >
        <Download className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors w-full",
        className
      )}
    >
      <Download className="h-4 w-4" />
      <span>Save for offline</span>
    </button>
  )
}
