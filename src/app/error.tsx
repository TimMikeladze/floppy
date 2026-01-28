"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error("[app-error] Caught error:", error)
  }, [error])

  const handleReset = () => {
    // Clear any potentially corrupted state
    try {
      // Reset the IndexedDB connection by clearing the module cache
      // This helps recover from stale database connections
      if (typeof window !== "undefined") {
        // Clear any cached data that might be causing issues
        sessionStorage.clear()
      }
    } catch (e) {
      console.error("[app-error] Failed to clear session storage:", e)
    }

    // Attempt to recover by re-rendering
    reset()
  }

  const handleGoHome = () => {
    // Force a full page reload to clear all state
    window.location.href = "/"
  }

  const handleHardReset = async () => {
    try {
      // Clear service worker caches
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.filter(name => name.startsWith("floppy-")).map(name => caches.delete(name))
        )
      }

      // Unregister service worker
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
      }

      // Force reload
      window.location.reload()
    } catch (e) {
      console.error("[app-error] Failed to perform hard reset:", e)
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. This can sometimes happen after an app update.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleReset} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>

          <Button
            onClick={handleHardReset}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Clear Cache & Reload
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-6 p-4 bg-muted rounded-lg text-left">
            <p className="text-sm font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
