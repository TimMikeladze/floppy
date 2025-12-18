"use client";

import { AlertCircle, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getIssueNumber,
  getSeriesName,
  getYear,
  normalizeSeriesName,
} from "@/lib/series-utils";
import type { Comic, SeriesGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ComicCard } from "./comic-card";
import { LibraryEmptyState } from "./library-empty-state";

interface SeriesViewProps {
  comics: Comic[];
  onDelete: (id: string) => void;
  onUpdate?: () => void;
  onUpload?: () => void;
}

function groupComicsBySeries(comics: Comic[]): SeriesGroup[] {
  const seriesMap = new Map<string, Comic[]>();

  for (const comic of comics) {
    const seriesName = getSeriesName(comic);
    const normalized = normalizeSeriesName(seriesName);

    if (!seriesMap.has(normalized)) {
      seriesMap.set(normalized, []);
    }
    seriesMap.get(normalized)?.push(comic);
  }

  const groups: SeriesGroup[] = [];

  for (const [normalizedName, seriesComics] of seriesMap) {
    // Sort by issue number
    const sortedComics = [...seriesComics].sort((a, b) => {
      const aIssue = getIssueNumber(a);
      const bIssue = getIssueNumber(b);
      if (aIssue === null && bIssue === null)
        return a.title.localeCompare(b.title);
      if (aIssue === null) return 1;
      if (bIssue === null) return -1;
      if (aIssue !== bIssue) return aIssue - bIssue;
      // Same issue number: sort by year ascending (oldest first)
      const aYear = getYear(a);
      const bYear = getYear(b);
      if (aYear !== null && bYear !== null) return aYear - bYear;
      if (aYear !== null) return -1;
      if (bYear !== null) return 1;
      return a.title.localeCompare(b.title);
    });

    // Calculate read count
    const readCount = sortedComics.filter((c) => {
      if (!c.totalPages) return false;
      return c.currentPage >= c.totalPages;
    }).length;

    // Find missing issues
    const issueNumbers = sortedComics
      .map((c) => getIssueNumber(c))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    const missingIssues: number[] = [];
    if (issueNumbers.length > 1) {
      const min = issueNumbers[0];
      const max = issueNumbers[issueNumbers.length - 1];
      for (let i = min; i <= max; i++) {
        if (!issueNumbers.includes(i)) {
          missingIssues.push(i);
        }
      }
    }

    // Use the display name from the first comic
    const displayName = getSeriesName(sortedComics[0]);

    groups.push({
      name: displayName,
      normalizedName,
      comics: sortedComics,
      issueCount: sortedComics.length,
      readCount,
      missingIssues,
      coverImage: sortedComics[0].coverImage,
    });
  }

  // Sort groups alphabetically
  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

interface SeriesRowProps {
  group: SeriesGroup;
  onDelete: (id: string) => void;
  onUpdate?: () => void;
}

function SeriesRow({ group, onDelete, onUpdate }: SeriesRowProps) {
  const [expanded, setExpanded] = useState(false);
  const progress =
    group.issueCount > 0 ? (group.readCount / group.issueCount) * 100 : 0;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Series Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left"
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </div>

        {/* Cover Thumbnail */}
        <div className="flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden bg-muted">
          {group.coverImage ? (
            <img
              src={group.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Series Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{group.name}</h3>
            {group.missingIssues.length > 0 && (
              <span
                className="flex items-center gap-1 text-xs text-amber-500"
                title={`Missing: #${group.missingIssues.join(", #")}`}
              >
                <AlertCircle className="w-3 h-3" />
                {group.missingIssues.length} missing
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {group.issueCount} {group.issueCount === 1 ? "issue" : "issues"}
            {group.readCount > 0 && ` · ${group.readCount} read`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex-shrink-0 w-24">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  progress >= 100
                    ? "bg-green-500"
                    : progress > 0
                      ? "bg-primary"
                      : "bg-transparent",
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Comics Grid */}
      {expanded && (
        <div className="px-4 pb-4">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(120px, 100%), 1fr))",
            }}
          >
            {group.comics.map((comic) => (
              <ComicCard
                key={comic.id}
                comic={comic}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
          {group.missingIssues.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Missing issues: #{group.missingIssues.join(", #")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function SeriesView({
  comics,
  onDelete,
  onUpdate,
  onUpload,
}: SeriesViewProps) {
  const seriesGroups = useMemo(() => groupComicsBySeries(comics), [comics]);

  if (comics.length === 0) {
    return <LibraryEmptyState onUpload={onUpload} />;
  }

  return (
    <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden bg-card">
      {seriesGroups.map((group) => (
        <SeriesRow
          key={group.normalizedName}
          group={group}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
