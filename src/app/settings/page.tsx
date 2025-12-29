"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, HardDrive, RefreshCw, Trash2, CheckCircle2, XCircle, Cloud, FileWarning } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
  getStorageStats,
  getComicStorageInfo,
  revalidateFileHandles,
  formatBytes,
  deleteComic,
  deletePagesForComic,
  type StorageStats,
  type ComicStorageInfo,
} from "@/lib/storage"
import { toast } from "sonner"

export default function SettingsPage() {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [comicStorage, setComicStorage] = useState<ComicStorageInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<{
    valid: string[]
    invalid: string[]
    remote: string[]
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ComicStorageInfo | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [storageStats, storageInfo] = await Promise.all([
        getStorageStats(),
        getComicStorageInfo(),
      ])
      setStats(storageStats)
      setComicStorage(storageInfo)
    } catch (error) {
      console.error("Failed to load storage stats:", error)
      toast.error("Failed to load storage statistics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleResync = async () => {
    setSyncing(true)
    setSyncResults(null)
    try {
      const results = await revalidateFileHandles()
      setSyncResults(results)
      await loadData() // Refresh data after sync

      if (results.invalid.length === 0) {
        toast.success("All local comics have valid file access")
      } else {
        toast.warning(`${results.invalid.length} comic(s) have lost file access`)
      }
    } catch (error) {
      console.error("Failed to resync:", error)
      toast.error("Failed to resync file handles")
    } finally {
      setSyncing(false)
    }
  }

  const handleDeleteComic = async (comic: ComicStorageInfo) => {
    try {
      await deleteComic(comic.id)
      toast.success(`Deleted "${comic.title}"`)
      await loadData()
    } catch (error) {
      console.error("Failed to delete comic:", error)
      toast.error("Failed to delete comic")
    }
    setDeleteTarget(null)
  }

  const handleClearPages = async (comic: ComicStorageInfo) => {
    try {
      await deletePagesForComic(comic.id)
      toast.success(`Cleared cached pages for "${comic.title}"`)
      await loadData()
    } catch (error) {
      console.error("Failed to clear pages:", error)
      toast.error("Failed to clear pages")
    }
  }

  // Estimate quota (browsers typically allow ~50% of free disk space, cap display at 500MB for reference)
  const estimatedQuota = 500 * 1024 * 1024 // 500MB reference
  const usagePercent = stats ? Math.min((stats.totalSize / estimatedQuota) * 100, 100) : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="safe-top safe-x bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <div className="flex items-center h-14 px-3 sm:px-4 md:px-6 gap-3 mx-auto w-full max-w-screen-2xl safe-x">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-md px-3 sm:px-4 md:px-6 py-6 space-y-6 safe-x pb-24">
        {/* Storage Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage
            </CardTitle>
            <CardDescription>
              Manage storage used by your comic library
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-2 bg-muted animate-pulse rounded" />
              </div>
            ) : stats ? (
              <>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{formatBytes(stats.totalSize)}</span>
                  <span className="text-sm text-muted-foreground">used</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Comics:</span>
                    <span className="ml-2 font-medium">{stats.comicsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cached pages:</span>
                    <span className="ml-2 font-medium">{formatBytes(stats.pagesSize)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bookmarks:</span>
                    <span className="ml-2 font-medium">{stats.bookmarksCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="ml-2 font-medium">{stats.notesCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lists:</span>
                    <span className="ml-2 font-medium">{stats.listsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data sources:</span>
                    <span className="ml-2 font-medium">{stats.sourcesCount}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Unable to load storage stats</p>
            )}
          </CardContent>
        </Card>

        {/* Resync Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              File Access
            </CardTitle>
            <CardDescription>
              Re-validate file permissions for local comics. Comics may lose access if files are moved or deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleResync}
              disabled={syncing || loading}
              className="w-full sm:w-auto"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resync File Access
                </>
              )}
            </Button>

            {syncResults && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>{syncResults.valid.length} local comics with valid access</span>
                </div>
                {syncResults.invalid.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-4 w-4" />
                    <span>{syncResults.invalid.length} comics lost file access</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cloud className="h-4 w-4" />
                  <span>{syncResults.remote.length} remote comics (no file needed)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comics Storage List */}
        <Card>
          <CardHeader>
            <CardTitle>Comics by Storage</CardTitle>
            <CardDescription>
              View and manage storage used by each comic
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : comicStorage.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No comics in library</p>
            ) : (
              <ScrollArea className="h-[400px] -mx-6">
                <div className="px-6 space-y-1">
                  {comicStorage.map((comic) => (
                    <div
                      key={comic.id}
                      className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{comic.title}</span>
                          {comic.sourceType === "remote" ? (
                            <Badge variant="secondary" className="shrink-0">
                              <Cloud className="h-3 w-3 mr-1" />
                              Remote
                            </Badge>
                          ) : !comic.hasValidHandle ? (
                            <Badge variant="destructive" className="shrink-0">
                              <FileWarning className="h-3 w-3 mr-1" />
                              No access
                            </Badge>
                          ) : null}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatBytes(comic.totalSize)}
                          {comic.pagesSize > 0 && (
                            <span className="ml-2">
                              ({formatBytes(comic.pagesSize)} cached)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {comic.pagesSize > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearPages(comic)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Clear cache
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(comic)}
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" and all associated bookmarks, notes, and cached pages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteComic(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
