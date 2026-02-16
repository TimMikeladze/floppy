"use client";

import {
  Bookmark,
  Check,
  CloudOff,
  Download,
  Image,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddToListDialog } from "@/components/library/add-to-list-dialog";
import { CoverManager } from "@/components/library/cover-manager";
import { EditComicDialog } from "@/components/library/edit-comic-dialog";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { useReading } from "@/lib/reading-context";
import {
  getOfflineStatus,
  type OfflineStatus,
  removeOfflineCache,
  saveComic,
  saveComicForOffline,
} from "@/lib/storage";
import type { Bookmark as BookmarkType, Comic } from "@/lib/types";
import { BookmarksPanel } from "./bookmarks-panel";
import { NotesPanel } from "./notes-panel";
import { PageNavigator } from "./page-navigator";
import { SettingsPanel } from "./settings-panel";

interface ReaderMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onBookmarkClick: () => void;
  comic: Comic;
  pages: string[];
  bookmarks: BookmarkType[];
  onRefreshBookmarks: () => void;
  onDelete: () => void;
  onComicUpdate?: () => void;
}

export function ReaderMenu({
  open,
  onOpenChange,
  currentPage,
  totalPages,
  onPageChange,
  onBookmarkClick,
  comic,
  pages,
  bookmarks,
  onRefreshBookmarks,
  onDelete,
  onComicUpdate,
}: ReaderMenuProps) {
  const { settings } = useReading();
  const [isDesktop, setIsDesktop] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [coverManagerOpen, setCoverManagerOpen] = useState(false);

  const comicId = comic.id;
  const isComplete = comic.totalPages && currentPage >= comic.totalPages - 1;
  const hasProgress = currentPage > 0;

  useEffect(() => {
    // Check for desktop on mount and window resize
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Check offline status
  const refreshOfflineStatus = useCallback(async () => {
    try {
      const status = await getOfflineStatus(comicId);
      setOfflineStatus(status);
    } catch (error) {
      console.error("[reader-menu] Failed to get offline status:", error);
    }
  }, [comicId]);

  useEffect(() => {
    refreshOfflineStatus();
  }, [refreshOfflineStatus]);

  const handleSaveForOffline = async () => {
    if (saving) return;
    setSaving(true);
    toast.info("Saving for offline...");

    try {
      const success = await saveComicForOffline(comicId, (prog) => {
        if (prog.status === "complete") {
          toast.success("Saved for offline");
          refreshOfflineStatus();
          setSaving(false);
        } else if (prog.status === "error") {
          toast.error(prog.error || "Failed to save for offline");
          setSaving(false);
        }
      });

      if (!success) {
        setSaving(false);
      }
    } catch (error) {
      console.error("Failed to save for offline:", error);
      toast.error("Failed to save for offline");
      setSaving(false);
    }
  };

  const handleRemoveOffline = async () => {
    try {
      await removeOfflineCache(comicId);
      toast.success("Offline cache removed");
      refreshOfflineStatus();
    } catch (error) {
      console.error("Failed to remove offline cache:", error);
      toast.error("Failed to remove offline cache");
    }
  };

  const handleMarkAsRead = async () => {
    if (!comic.totalPages) {
      toast.error("Cannot mark as read: page count unknown");
      return;
    }
    try {
      await saveComic({
        ...comic,
        currentPage: comic.totalPages,
        lastRead: new Date(),
      });
      toast.success("Marked as read");
      onComicUpdate?.();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAsUnread = async () => {
    try {
      await saveComic({
        ...comic,
        currentPage: 0,
        lastRead: undefined,
      });
      toast.success("Marked as unread");
      onComicUpdate?.();
    } catch (error) {
      console.error("Failed to mark as unread:", error);
      toast.error("Failed to mark as unread");
    }
  };

  // Use bottom on mobile, respect toolbarPosition on desktop
  const drawerDirection = isDesktop
    ? (settings.toolbarPosition ?? "right")
    : "bottom";

  const isBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={drawerDirection}>
      <DrawerContent
        className={
          drawerDirection === "bottom" || drawerDirection === "top"
            ? "max-h-[85vh]"
            : ""
        }
      >
        {/* Page Scrubber - Always visible at top */}
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium tabular-nums text-muted-foreground min-w-[4rem]">
              {currentPage + 1} / {totalPages}
            </span>
            <Slider
              value={[currentPage]}
              min={0}
              max={totalPages - 1}
              step={1}
              onValueChange={([value]) => onPageChange(value)}
              className="flex-1"
            />
          </div>
        </div>

        {/* Quick Actions Row - Navigation */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="flex justify-around">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-auto py-2 px-3 ${isBookmarked ? "text-primary" : ""}`}
              onClick={() => {
                onBookmarkClick();
              }}
            >
              <Bookmark
                className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
              />
              <span className="text-xs">Bookmark</span>
            </Button>

            <PageNavigator
              pages={pages}
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page);
                onOpenChange(false);
              }}
              bookmarks={bookmarks}
              variant="menu"
            />

            <BookmarksPanel
              comicId={comicId}
              pages={pages}
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page);
                onOpenChange(false);
              }}
              onRefresh={onRefreshBookmarks}
              variant="menu"
            />

            <NotesPanel
              comicId={comicId}
              pages={pages}
              currentPage={currentPage}
              onPageSelect={(page) => {
                onPageChange(page);
                onOpenChange(false);
              }}
              variant="menu"
            />

            <SettingsPanel variant="menu" />
          </div>
        </div>

        {/* Comic Actions Row */}
        <div className="px-4 py-3">
          <div className="flex justify-around">
            {/* Mark as Read / Unread */}
            {comic.totalPages && !isComplete ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-1 h-auto py-2 px-3"
                onClick={handleMarkAsRead}
              >
                <Check className="h-5 w-5" />
                <span className="text-xs">Mark Read</span>
              </Button>
            ) : hasProgress ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-1 h-auto py-2 px-3"
                onClick={handleMarkAsUnread}
              >
                <RotateCcw className="h-5 w-5" />
                <span className="text-xs">Unread</span>
              </Button>
            ) : null}

            {/* Add to List */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-3"
              onClick={() => setAddToListOpen(true)}
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs">Add to List</span>
            </Button>

            {/* Edit Details */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-3"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="h-5 w-5" />
              <span className="text-xs">Edit</span>
            </Button>

            {/* Manage Cover */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-3"
              onClick={() => setCoverManagerOpen(true)}
            >
              <Image className="h-5 w-5" />
              <span className="text-xs">Cover</span>
            </Button>

            {/* Offline actions */}
            {offlineStatus?.isAvailableOffline ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-1 h-auto py-2 px-3"
                onClick={handleRemoveOffline}
              >
                <CloudOff className="h-5 w-5" />
                <span className="text-xs">Remove</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="flex-col gap-1 h-auto py-2 px-3"
                onClick={handleSaveForOffline}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span className="text-xs">{saving ? "Saving" : "Offline"}</span>
              </Button>
            )}

            <DeleteButton
              onDelete={onDelete}
              size="sm"
              className="flex-col gap-1 h-auto py-2 px-3 text-destructive hover:text-destructive"
              variant="menu"
            />
          </div>
        </div>
      </DrawerContent>

      {/* Dialogs */}
      <AddToListDialog
        comicId={comicId}
        comicTitle={comic.title}
        open={addToListOpen}
        onOpenChange={setAddToListOpen}
      />

      <EditComicDialog
        comic={comic}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={() => onComicUpdate?.()}
      />

      <CoverManager
        comic={comic}
        open={coverManagerOpen}
        onOpenChange={setCoverManagerOpen}
        onCoverChange={() => onComicUpdate?.()}
      />
    </Drawer>
  );
}
