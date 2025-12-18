"use client";

import { Command } from "cmdk";
import {
  BarChart3,
  BookOpen,
  Layers,
  Library,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getSeriesName, normalizeSeriesName } from "@/lib/series-utils";
import { getAllComics, saveComic } from "@/lib/storage";
import type { Comic } from "@/lib/types";

interface CommandPaletteProps {
  onOpenChange?: (open: boolean) => void;
  onUpload?: () => void;
  onOpenStats?: () => void;
}

export function CommandPalette({
  onOpenChange,
  onUpload,
  onOpenStats,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [comics, setComics] = useState<Comic[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Load comics when palette opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: loadComics is stable
  useEffect(() => {
    if (open) {
      loadComics();
    }
  }, [open]);

  async function loadComics() {
    try {
      const allComics = await getAllComics();
      setComics(allComics);
    } catch (error) {
      console.error("Failed to load comics:", error);
    }
  }

  // Get unique series
  const uniqueSeries = [
    ...new Set(comics.map((c) => normalizeSeriesName(getSeriesName(c)))),
  ]
    .map((normalized) => {
      const comic = comics.find(
        (c) => normalizeSeriesName(getSeriesName(c)) === normalized,
      );
      return {
        normalized,
        display: comic ? getSeriesName(comic) : normalized,
        count: comics.filter(
          (c) => normalizeSeriesName(getSeriesName(c)) === normalized,
        ).length,
      };
    })
    .sort((a, b) => b.count - a.count);

  // In-progress comics for quick continue
  const inProgressComics = comics
    .filter(
      (c) => c.totalPages && c.currentPage > 0 && c.currentPage < c.totalPages,
    )
    .sort((a, b) => {
      const aTime = a.lastRead ? new Date(a.lastRead).getTime() : 0;
      const bTime = b.lastRead ? new Date(b.lastRead).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  const _handleMarkAsRead = async (comic: Comic) => {
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
      toast.success(`Marked "${comic.title}" as read`);
      loadComics();
    } catch (_error) {
      toast.error("Failed to mark as read");
    }
  };

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open);
      onOpenChange?.(open);
      if (!open) {
        setSearch("");
      }
    },
    [onOpenChange],
  );

  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    setSearch("");
    callback();
  }, []);

  // Filter comics based on search
  const filteredComics = comics.filter((comic) => {
    const query = search.toLowerCase();
    return (
      comic.title.toLowerCase().includes(query) ||
      comic.series?.toLowerCase().includes(query) ||
      comic.issue?.toLowerCase().includes(query) ||
      comic.author?.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden">
        <Command shouldFilter={false} className="rounded-lg border-0">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search comics or type a command..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Quick Actions */}
            {!search && (
              <Command.Group heading="Quick Actions">
                {onUpload && (
                  <Command.Item
                    onSelect={() => handleSelect(onUpload)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload Comics</span>
                    <kbd className="ml-auto text-xs text-muted-foreground">
                      ⌘U
                    </kbd>
                  </Command.Item>
                )}
                {onOpenStats && (
                  <Command.Item
                    onSelect={() => handleSelect(onOpenStats)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Library Statistics</span>
                  </Command.Item>
                )}
                <Command.Item
                  onSelect={() =>
                    handleSelect(() =>
                      setTheme(theme === "dark" ? "light" : "dark"),
                    )
                  }
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  <span>Toggle Theme</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Continue Reading */}
            {!search && inProgressComics.length > 0 && (
              <Command.Group heading="Continue Reading">
                {inProgressComics.map((comic) => (
                  <Command.Item
                    key={`continue-${comic.id}`}
                    value={`continue-${comic.id}`}
                    onSelect={() =>
                      handleSelect(() => router.push(`/reader/${comic.id}`))
                    }
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                  >
                    <div className="flex-shrink-0">
                      {comic.coverImage ? (
                        <img
                          src={comic.coverImage}
                          alt=""
                          className="h-10 w-7 object-cover rounded-sm"
                        />
                      ) : (
                        <div className="h-10 w-7 rounded-sm bg-muted flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{comic.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Page {comic.currentPage} of {comic.totalPages}
                      </div>
                    </div>
                    <div className="text-xs text-primary font-medium">
                      {Math.round(
                        (comic.currentPage / comic.totalPages!) * 100,
                      )}
                      %
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            {!search && (
              <Command.Group heading="Navigation">
                <Command.Item
                  onSelect={() => handleSelect(() => router.push("/library"))}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Library className="h-4 w-4" />
                  <span>Library</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => router.push("/releases"))}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Releases</span>
                </Command.Item>
                <Command.Item
                  onSelect={() => handleSelect(() => router.push("/settings"))}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Command.Item>
              </Command.Group>
            )}

            {/* Series - when searching */}
            {search &&
              uniqueSeries.filter((s) =>
                s.display.toLowerCase().includes(search.toLowerCase()),
              ).length > 0 && (
                <Command.Group heading="Series">
                  {uniqueSeries
                    .filter((s) =>
                      s.display.toLowerCase().includes(search.toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((series) => (
                      <Command.Item
                        key={`series-${series.normalized}`}
                        value={`series-${series.normalized}`}
                        onSelect={() =>
                          handleSelect(() =>
                            router.push(
                              `/library?q=${encodeURIComponent(series.display)}&view=series`,
                            ),
                          )
                        }
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                      >
                        <Layers className="h-4 w-4" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {series.display}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {series.count} issues
                          </div>
                        </div>
                      </Command.Item>
                    ))}
                </Command.Group>
              )}

            {/* Comics */}
            {filteredComics.length > 0 && (
              <Command.Group heading={search ? "Comics" : "Recent Comics"}>
                {(search ? filteredComics : filteredComics.slice(0, 8)).map(
                  (comic) => (
                    <Command.Item
                      key={comic.id}
                      value={comic.id}
                      onSelect={() =>
                        handleSelect(() => router.push(`/reader/${comic.id}`))
                      }
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm cursor-pointer hover:bg-accent aria-selected:bg-accent"
                    >
                      <div className="flex-shrink-0">
                        {comic.coverImage ? (
                          <img
                            src={comic.coverImage}
                            alt=""
                            className="h-10 w-7 object-cover rounded-sm"
                          />
                        ) : (
                          <div className="h-10 w-7 rounded-sm bg-muted flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {comic.title}
                        </div>
                        {comic.series && (
                          <div className="text-xs text-muted-foreground truncate">
                            {comic.series}
                            {comic.issue && ` #${comic.issue}`}
                          </div>
                        )}
                      </div>
                      {comic.currentPage > 0 && comic.totalPages && (
                        <div className="text-xs text-muted-foreground">
                          {Math.round(
                            (comic.currentPage / comic.totalPages) * 100,
                          )}
                          %
                        </div>
                      )}
                    </Command.Item>
                  ),
                )}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ⌘K
              </kbd>
              <span>Toggle</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
