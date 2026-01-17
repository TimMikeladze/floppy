"use client"

import { WifiOff } from "lucide-react"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { cn } from "@/lib/utils"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm",
        "px-4 py-2 text-center text-sm font-medium text-white",
        "flex items-center justify-center gap-2",
        "shadow-sm"
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>You're offline. Some features may be unavailable.</span>
    </div>
  )
}
