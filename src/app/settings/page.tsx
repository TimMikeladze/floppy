"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  Eraser,
  FileWarning,
  HardDrive,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type ComicStorageInfo,
  clearAllCachedPages,
  deleteComic,
  deletePagesForComic,
  formatBytes,
  getComicStorageInfo,
  getStorageStats,
  revalidateFileHandles,
  type StorageStats,
} from "@/lib/storage";

export default function SettingsPage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [comicStorage, setComicStorage] = useState<ComicStorageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    valid: string[];
    invalid: string[];
    remote: string[];
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ComicStorageInfo | null>(
    null,
  );
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [storageStats, storageInfo] = await Promise.all([
        getStorageStats(),
        getComicStorageInfo(),
      ]);
      setStats(storageStats);
      setComicStorage(storageInfo);
    } catch (error) {
      console.error("Failed to load storage stats:", error);
      toast.error("Failed to load storage statistics");
    } finally {
      setLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only effect
  useEffect(() => {
    loadData();
  }, []);

  const handleResync = async () => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const results = await revalidateFileHandles();
      setSyncResults(results);
      await loadData();

      if (results.invalid.length === 0) {
        toast.success("All local comics have valid file access");
      } else {
        toast.warning(
          `${results.invalid.length} comic(s) have lost file access`,
        );
      }
    } catch (error) {
      console.error("Failed to resync:", error);
      toast.error("Failed to resync file handles");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAllCache = async () => {
    setClearingCache(true);
    try {
      const count = await clearAllCachedPages();
      toast.success(`Cleared cache for ${count} comic(s)`);
      await loadData();
    } catch (error) {
      console.error("Failed to clear cache:", error);
      toast.error("Failed to clear cache");
    } finally {
      setClearingCache(false);
      setShowClearCacheDialog(false);
    }
  };

  const handleDeleteComic = async (comic: ComicStorageInfo) => {
    try {
      await deleteComic(comic.id);
      toast.success(`Deleted "${comic.title}"`);
      await loadData();
    } catch (error) {
      console.error("Failed to delete comic:", error);
      toast.error("Failed to delete comic");
    }
    setDeleteTarget(null);
  };

  const handleClearPages = async (comic: ComicStorageInfo) => {
    try {
      await deletePagesForComic(comic.id);
      toast.success(`Cleared cache for "${comic.title}"`);
      await loadData();
    } catch (error) {
      console.error("Failed to clear pages:", error);
      toast.error("Failed to clear pages");
    }
  };

  const estimatedQuota = 500 * 1024 * 1024;
  const usagePercent = stats
    ? Math.min((stats.totalSize / estimatedQuota) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="safe-top safe-x bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <div className="flex items-center h-14 px-3 sm:px-4 md:px-6 gap-3 mx-auto w-full max-w-screen-2xl safe-x">
          <Link href="/library">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-md px-3 sm:px-4 md:px-6 py-4 space-y-4 pb-24">
        {/* Storage Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              Storage
            </CardTitle>
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
                  <span className="text-2xl font-bold">
                    {formatBytes(stats.totalSize)}
                  </span>
                  <span className="text-sm text-muted-foreground">used</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comics</span>
                    <span>{stats.comicsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cached</span>
                    <span>{formatBytes(stats.pagesSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bookmarks</span>
                    <span>{stats.bookmarksCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Notes</span>
                    <span>{stats.notesCount}</span>
                  </div>
                </div>
                {stats.pagesSize > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearCacheDialog(true)}
                    disabled={clearingCache}
                    className="w-full"
                  >
                    <Eraser className="h-4 w-4 mr-2" />
                    Clear All Cached Pages
                  </Button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                Unable to load storage stats
              </p>
            )}
          </CardContent>
        </Card>

        {/* Resync Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4" />
              File Access
            </CardTitle>
            <CardDescription className="text-xs">
              Re-validate permissions for local comics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleResync}
              disabled={syncing || loading}
              size="sm"
              className="w-full"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resync
                </>
              )}
            </Button>

            {syncResults && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>{syncResults.valid.length} valid</span>
                </div>
                {syncResults.invalid.length > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-3 w-3" />
                    <span>{syncResults.invalid.length} lost access</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cloud className="h-3 w-3" />
                  <span>{syncResults.remote.length} remote</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comics Storage List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comics by Storage</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : comicStorage.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">
                No comics in library
              </p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="divide-y divide-border">
                  {comicStorage.map((comic) => (
                    <div
                      key={comic.id}
                      className="flex items-center gap-2 py-2 px-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm truncate">
                            {comic.title}
                          </span>
                          {comic.sourceType === "remote" ? (
                            <Cloud className="h-3 w-3 text-muted-foreground shrink-0" />
                          ) : !comic.hasValidHandle ? (
                            <FileWarning className="h-3 w-3 text-destructive shrink-0" />
                          ) : null}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatBytes(comic.totalSize)}
                      </span>
                      {comic.pagesSize > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearPages(comic)}
                          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                        >
                          Clear
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(comic)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comic?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" and all
              associated data.
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

      {/* Clear Cache Confirmation Dialog */}
      <AlertDialog
        open={showClearCacheDialog}
        onOpenChange={setShowClearCacheDialog}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all cached pages?</AlertDialogTitle>
            <AlertDialogDescription>
              This will free up {stats ? formatBytes(stats.pagesSize) : "0 B"}{" "}
              of storage. Comics will need to reload pages from their source
              files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllCache}
              disabled={clearingCache}
            >
              {clearingCache ? "Clearing..." : "Clear Cache"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
