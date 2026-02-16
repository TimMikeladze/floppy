"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  DollarSign,
  Heart,
  Palette,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePullList } from "@/hooks/use-pull-list";
import type { Publisher, Release } from "@/lib/releases-types";

interface ReleaseDetailContentProps {
  release: Release;
  publisher?: Publisher;
  releasesEnabled?: boolean;
}

export function ReleaseDetailContent({
  release,
  publisher,
  releasesEnabled = true,
}: ReleaseDetailContentProps) {
  const pullList = usePullList();
  const isInPullList = pullList.isInList(release.id);
  const isSeriesSubscribed = pullList.isSubscribedToSeries(release.series);

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-500",
    released: "bg-green-500/10 text-green-500",
    delayed: "bg-yellow-500/10 text-yellow-500",
    cancelled: "bg-red-500/10 text-red-500",
  };

  return (
    <AppLayout
      searchQuery=""
      onSearchChange={() => {}}
      sortBy="recent"
      onSortChange={() => {}}
      viewMode="grid"
      onViewModeChange={() => {}}
      releasesEnabled={releasesEnabled}
    >
      <div>
        {/* Back button */}
        <Link
          href="/releases"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Releases
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Cover Image */}
            {release.coverUrl && (
              <div className="aspect-[2/3] w-full sm:w-64 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={release.coverUrl}
                  alt={release.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {release.title}
                </h1>
                <p className="text-muted-foreground">
                  {release.series} #{release.issueNumber}
                </p>
              </div>

              {/* Status Badge */}
              <Badge className={statusColors[release.status] || ""}>
                {release.status.charAt(0).toUpperCase() +
                  release.status.slice(1)}
              </Badge>

              {/* Pull List Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isInPullList ? "default" : "outline"}
                  onClick={() => pullList.togglePullListItem(release.id)}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${isInPullList ? "fill-current" : ""}`}
                  />
                  {isInPullList ? "In Pull List" : "Add to Pull List"}
                </Button>
                <Button
                  variant={isSeriesSubscribed ? "default" : "outline"}
                  onClick={() =>
                    pullList.toggleSeriesSubscription(release.series)
                  }
                >
                  <Bell
                    className={`h-4 w-4 mr-2 ${isSeriesSubscribed ? "fill-current" : ""}`}
                  />
                  {isSeriesSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Series</p>
                <p className="text-sm font-medium">
                  {release.series} #{release.issueNumber}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Release Date</p>
                <p className="text-sm font-medium">
                  {format(new Date(release.releaseDate), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-sm font-medium">{release.price || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Format</p>
                <p className="text-sm font-medium capitalize">
                  {release.format.replace("-", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Publisher */}
          <div className="flex items-start gap-2">
            <div className="h-4 w-4" />
            <div>
              <p className="text-xs text-muted-foreground">Publisher</p>
              <div className="flex items-center gap-2">
                {publisher?.color && (
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: publisher.color }}
                  />
                )}
                <p className="text-sm font-medium">
                  {publisher?.name || release.publisher}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Creators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Writer{release.writers.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm">{release.writers.join(", ")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Palette className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Artist{release.artists.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm">{release.artists.join(", ")}</p>
              </div>
            </div>
          </div>

          {/* Genres */}
          {release.genres.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Genres</p>
                <div className="flex flex-wrap gap-2">
                  {release.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Description */}
          {release.description && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Description
                </p>
                <p className="text-sm leading-relaxed">{release.description}</p>
              </div>
            </>
          )}

          {/* Tags */}
          {release.tags && release.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {release.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Variant Covers */}
          {release.variants && release.variants.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Variant Covers
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {release.variants.map((variant, index) => (
                    <div key={index} className="space-y-1">
                      {variant.coverUrl && (
                        <div className="aspect-[2/3] overflow-hidden rounded bg-muted">
                          <img
                            src={variant.coverUrl}
                            alt={variant.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs text-center truncate">
                        {variant.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          {(release.pageCount || release.ageRating || release.isbn) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                {release.pageCount && (
                  <div>
                    <p className="text-xs text-muted-foreground">Page Count</p>
                    <p>{release.pageCount}</p>
                  </div>
                )}
                {release.ageRating && (
                  <div>
                    <p className="text-xs text-muted-foreground">Age Rating</p>
                    <p>{release.ageRating}</p>
                  </div>
                )}
                {release.isbn && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">ISBN</p>
                    <p className="font-mono text-xs">{release.isbn}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
