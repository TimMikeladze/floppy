"use client";

import { formatDistanceToNow } from "date-fns";
import { BookmarkIcon, StickyNote, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { deleteBookmark, getBookmarks } from "@/lib/storage";
import type { Bookmark } from "@/lib/types";

interface BookmarksPanelProps {
  comicId: string;
  pages: string[];
  currentPage: number;
  onPageSelect: (page: number) => void;
  onRefresh?: () => void;
  variant?: "icon" | "menu";
}

export function BookmarksPanel({
  comicId,
  pages,
  currentPage,
  onPageSelect,
  onRefresh,
  variant = "icon",
}: BookmarksPanelProps) {
  const [open, setOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadBookmarks is stable
  useEffect(() => {
    if (open) {
      loadBookmarks();
    }
  }, [open]);

  async function loadBookmarks() {
    try {
      const loaded = await getBookmarks(comicId);
      setBookmarks(
        loaded.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      );
    } catch (error) {
      console.error("[v0] Error loading bookmarks:", error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBookmark(id);
      await loadBookmarks();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("[v0] Error deleting bookmark:", error);
    }
  }

  async function handleSaveEdit(bookmark: Bookmark) {
    try {
      const { saveBookmark } = await import("@/lib/storage");
      await saveBookmark({
        ...bookmark,
        note: editNote,
      });
      setEditingId(null);
      setEditNote("");
      await loadBookmarks();
    } catch (error) {
      console.error("[v0] Error updating bookmark:", error);
    }
  }

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ) ||
      `page ${b.pageNumber + 1}`.includes(searchQuery.toLowerCase()),
  );

  const trigger =
    variant === "menu" ? (
      <Button
        variant="ghost"
        size="sm"
        className="flex-col gap-1 h-auto py-2 px-3"
      >
        <BookmarkIcon className="h-5 w-5" />
        <span className="text-xs">Bookmarks</span>
      </Button>
    ) : (
      <Button variant="ghost" size="icon">
        <BookmarkIcon className="h-5 w-5" />
        <span className="sr-only">View bookmarks</span>
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Bookmarks</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <BookmarkIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {searchQuery ? "No matching bookmarks" : "No bookmarks yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onPageSelect(bookmark.pageNumber);
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-3 p-3 text-left"
                    disabled={editingId === bookmark.id}
                  >
                    <div className="relative aspect-[2/3] w-20 flex-shrink-0 overflow-hidden rounded bg-muted">
                      <img
                        src={pages[bookmark.pageNumber] || "/placeholder.svg"}
                        alt={`Page ${bookmark.pageNumber + 1}`}
                        className="h-full w-full object-contain"
                      />
                      {bookmark.pageNumber === currentPage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        Page {bookmark.pageNumber + 1}
                      </p>

                      {editingId === bookmark.id ? (
                        <div
                          className="mt-2 space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Textarea
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Add a note..."
                            className="min-h-[60px] text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(bookmark)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(null);
                                setEditNote("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {bookmark.note && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                              {bookmark.note}
                            </p>
                          )}
                          {bookmark.tags && bookmark.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {bookmark.tags.map((tag, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(bookmark.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </button>

                  {editingId !== bookmark.id && (
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(bookmark.id);
                          setEditNote(bookmark.note || "");
                        }}
                      >
                        <StickyNote className="h-4 w-4" />
                        <span className="sr-only">Edit note</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(bookmark.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete bookmark</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
