"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock,
  HardDrive,
  Layers,
  Library,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSeriesName, normalizeSeriesName } from "@/lib/series-utils";
import {
  formatBytes,
  getAllComics,
  getStorageStats,
  type StorageStats,
} from "@/lib/storage";
import type { Comic } from "@/lib/types";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  progress?: number;
  color?: string;
}

function StatsCard({
  title,
  value,
  subtitle,
  icon,
  progress,
  color,
}: StatsCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p
            className="text-2xl font-bold"
            style={color ? { color } : undefined}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: color ? `${color}15` : "var(--secondary)",
            color: color || "var(--muted-foreground)",
          }}
        >
          {icon}
        </div>
      </div>
      {progress !== undefined && (
        <div className="mt-3">
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </Card>
  );
}

interface LibraryStatsProps {
  onClose?: () => void;
}

export function LibraryStats({ onClose: _onClose }: LibraryStatsProps) {
  const [comics, setComics] = useState<Comic[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [allComics, storage] = await Promise.all([
          getAllComics(),
          getStorageStats(),
        ]);
        setComics(allComics);
        setStorageStats(storage);
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Calculate stats
  const totalComics = comics.length;
  const localComics = comics.filter((c) => c.sourceType === "local").length;
  const remoteComics = comics.filter((c) => c.sourceType === "remote").length;

  // Reading stats
  const completedComics = comics.filter((c) => {
    if (!c.totalPages) return false;
    return c.currentPage >= c.totalPages;
  }).length;

  const readingComics = comics.filter((c) => {
    if (!c.totalPages) return false;
    const progress = c.currentPage / c.totalPages;
    return progress > 0 && progress < 1;
  }).length;

  const wantToReadComics = comics.filter((c) => {
    if (!c.totalPages) return c.currentPage === 0;
    return c.currentPage === 0;
  }).length;

  // Progress calculations
  const totalPages = comics.reduce((sum, c) => sum + (c.totalPages || 0), 0);
  const pagesRead = comics.reduce((sum, c) => sum + c.currentPage, 0);
  const overallProgress = totalPages > 0 ? (pagesRead / totalPages) * 100 : 0;

  // Series stats
  const seriesSet = new Set(
    comics.map((c) => normalizeSeriesName(getSeriesName(c))),
  );
  const uniqueSeries = seriesSet.size;

  // Completed series
  const seriesCompletion = new Map<
    string,
    { total: number; completed: number }
  >();
  comics.forEach((comic) => {
    const series = normalizeSeriesName(getSeriesName(comic));
    if (!seriesCompletion.has(series)) {
      seriesCompletion.set(series, { total: 0, completed: 0 });
    }
    const entry = seriesCompletion.get(series)!;
    entry.total++;
    if (comic.totalPages && comic.currentPage >= comic.totalPages) {
      entry.completed++;
    }
  });
  const completedSeries = Array.from(seriesCompletion.values()).filter(
    (s) => s.total > 0 && s.completed === s.total,
  ).length;

  // Format stats
  const formatsByCount: Record<string, number> = {};
  comics.forEach((c) => {
    const format = c.format || "unknown";
    formatsByCount[format] = (formatsByCount[format] || 0) + 1;
  });

  // Publishers
  const publisherCounts: Record<string, number> = {};
  comics.forEach((c) => {
    if (c.publisher) {
      publisherCounts[c.publisher] = (publisherCounts[c.publisher] || 0) + 1;
    }
  });
  const topPublishers = Object.entries(publisherCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Recently read
  const recentlyRead = comics
    .filter((c) => c.lastRead)
    .sort(
      (a, b) =>
        new Date(b.lastRead!).getTime() - new Date(a.lastRead!).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Comics"
          value={totalComics}
          subtitle={`${localComics} local, ${remoteComics} remote`}
          icon={<Library className="h-5 w-5" />}
        />
        <StatsCard
          title="Completed"
          value={completedComics}
          subtitle={`${Math.round((completedComics / totalComics) * 100) || 0}% of library`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="#10b981"
          progress={(completedComics / totalComics) * 100}
        />
        <StatsCard
          title="Currently Reading"
          value={readingComics}
          subtitle={`${wantToReadComics} want to read`}
          icon={<BookOpen className="h-5 w-5" />}
          color="#3b82f6"
        />
        <StatsCard
          title="Series"
          value={uniqueSeries}
          subtitle={`${completedSeries} completed`}
          icon={<Layers className="h-5 w-5" />}
          color="#8b5cf6"
        />
      </div>

      {/* Progress Stats */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-4">Reading Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Overall Progress
              </span>
              <span className="text-sm font-medium">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {pagesRead.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Pages Read</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {totalPages.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Pages</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {(totalPages - pagesRead).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Pages Remaining</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Storage Stats */}
      {storageStats && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Storage Usage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-lg font-bold">
                {formatBytes(storageStats.totalSize)}
              </p>
              <p className="text-xs text-muted-foreground">Total Size</p>
            </div>
            <div>
              <p className="text-lg font-bold">
                {formatBytes(storageStats.pagesSize)}
              </p>
              <p className="text-xs text-muted-foreground">Cached Pages</p>
            </div>
            <div>
              <p className="text-lg font-bold">{storageStats.bookmarksCount}</p>
              <p className="text-xs text-muted-foreground">Bookmarks</p>
            </div>
            <div>
              <p className="text-lg font-bold">{storageStats.notesCount}</p>
              <p className="text-xs text-muted-foreground">Notes</p>
            </div>
          </div>
        </Card>
      )}

      {/* Format Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4">By Format</h3>
          <div className="space-y-2">
            {Object.entries(formatsByCount)
              .sort((a, b) => b[1] - a[1])
              .map(([format, count]) => (
                <div key={format} className="flex items-center justify-between">
                  <span className="text-sm uppercase">{format}</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-primary rounded-full"
                      style={{
                        width: `${(count / totalComics) * 100}px`,
                        maxWidth: "100px",
                      }}
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        {topPublishers.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-medium mb-4">Top Publishers</h3>
            <div className="space-y-2">
              {topPublishers.map(([publisher, count]) => (
                <div
                  key={publisher}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm truncate max-w-[150px]">
                    {publisher}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 bg-primary rounded-full"
                      style={{
                        width: `${(count / totalComics) * 100}px`,
                        maxWidth: "100px",
                      }}
                    />
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Recently Read */}
      {recentlyRead.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recently Read
          </h3>
          <div className="space-y-3">
            {recentlyRead.map((comic) => (
              <div key={comic.id} className="flex items-center gap-3">
                {comic.coverImage ? (
                  <img
                    src={comic.coverImage}
                    alt=""
                    className="w-8 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-12 bg-secondary rounded flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{comic.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {comic.totalPages &&
                      `${Math.round((comic.currentPage / comic.totalPages) * 100)}% complete`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(comic.lastRead!).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
