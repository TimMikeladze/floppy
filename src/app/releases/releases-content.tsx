"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ReleaseSubmissionDialog } from "@/components/releases/release-submission-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePullList } from "@/hooks/use-pull-list";
import { useReleasesCrud } from "@/hooks/use-releases-crud";
import {
  getStoredReleasesPreferences,
  saveReleasesPreferences,
} from "@/hooks/use-releases-preferences";
import type { Release } from "@/lib/releases-types";

const viewTypes = ["new", "upcoming", "calendar", "pull-list"] as const;

interface ReleasesContentProps {
  releasesEnabled: boolean;
}

export function ReleasesContent({ releasesEnabled }: ReleasesContentProps) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );
  const [activeView, setActiveView] = useQueryState(
    "view",
    parseAsStringLiteral(viewTypes).withDefault("new"),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  // Track if we've initialized from localStorage
  const hasInitializedFromStorage = useRef(false);

  // Use the CRUD hook for releases data (read-only)
  const { releases, loading, getNew, getUpcoming, getByDate } =
    useReleasesCrud();

  const pullList = usePullList();

  // Initialize from localStorage if no URL params are present
  useEffect(() => {
    if (hasInitializedFromStorage.current) return;
    hasInitializedFromStorage.current = true;

    const urlParams = new URLSearchParams(window.location.search);
    const hasViewParam = urlParams.has("view");

    if (!hasViewParam) {
      const stored = getStoredReleasesPreferences();
      if (stored.view !== "new") setActiveView(stored.view);
    }
  }, [setActiveView]);

  // Persist preferences to localStorage when they change
  useEffect(() => {
    if (!hasInitializedFromStorage.current) return;

    saveReleasesPreferences({
      view: activeView as "new" | "upcoming" | "calendar" | "pull-list",
    });
  }, [activeView]);

  // Compute new and upcoming releases
  const [newReleases, setNewReleases] = useState<Release[]>([]);
  const [upcomingReleases, setUpcomingReleases] = useState<Release[]>([]);
  const [selectedDateReleases, setSelectedDateReleases] = useState<Release[]>(
    [],
  );

  useEffect(() => {
    getNew().then(setNewReleases);
    getUpcoming().then(setUpcomingReleases);
  }, [getNew, getUpcoming]);

  useEffect(() => {
    if (selectedDate) {
      getByDate(selectedDate).then(setSelectedDateReleases);
    } else {
      setSelectedDateReleases([]);
    }
  }, [selectedDate, getByDate]);

  const filteredNewReleases = useMemo(() => {
    if (!searchQuery) return newReleases;
    const query = searchQuery.toLowerCase();
    return newReleases.filter(
      (release) =>
        release.title.toLowerCase().includes(query) ||
        release.series.toLowerCase().includes(query) ||
        release.publisher.toLowerCase().includes(query) ||
        release.writers.some((w) => w.toLowerCase().includes(query)) ||
        release.artists.some((a) => a.toLowerCase().includes(query)),
    );
  }, [newReleases, searchQuery]);

  const filteredUpcomingReleases = useMemo(() => {
    if (!searchQuery) return upcomingReleases;
    const query = searchQuery.toLowerCase();
    return upcomingReleases.filter(
      (release) =>
        release.title.toLowerCase().includes(query) ||
        release.series.toLowerCase().includes(query) ||
        release.publisher.toLowerCase().includes(query) ||
        release.writers.some((w) => w.toLowerCase().includes(query)) ||
        release.artists.some((a) => a.toLowerCase().includes(query)),
    );
  }, [upcomingReleases, searchQuery]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    const startDay = start.getDay();
    const paddingStart = Array(startDay).fill(null);

    return [...paddingStart, ...days];
  }, [currentMonth]);

  // Get releases by date for calendar (synchronous from loaded data)
  const getReleasesForDay = (day: Date) => {
    return releases.filter(
      (r) => r.releaseDate.toDateString() === day.toDateString(),
    );
  };

  // Calculate pull list items count
  const pullListReleasesCount = useMemo(() => {
    const uniqueReleaseIds = new Set(
      pullList.items.map((item) => item.releaseId),
    );
    const subscribedReleases = releases.filter((release) =>
      pullList.subscriptions.some((sub) => sub.seriesName === release.series),
    );
    return uniqueReleaseIds.size + subscribedReleases.length;
  }, [pullList.items, pullList.subscriptions, releases]);

  const views = [
    {
      key: "new" as const,
      label: "New Releases",
      icon: Sparkles,
      count: filteredNewReleases.length,
    },
    {
      key: "upcoming" as const,
      label: "Upcoming",
      icon: Clock,
      count: filteredUpcomingReleases.length,
    },
    { key: "calendar" as const, label: "Calendar", icon: CalendarIcon },
    {
      key: "pull-list" as const,
      label: "Pull List",
      icon: Heart,
      count: pullListReleasesCount,
    },
  ];

  if (loading) {
    return (
      <AppLayout
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy="recent"
        onSortChange={() => {}}
        viewMode="grid"
        onViewModeChange={() => {}}
        releasesEnabled={releasesEnabled}
      >
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      sortBy="recent"
      onSortChange={() => {}}
      viewMode="grid"
      onViewModeChange={() => {}}
      releasesEnabled={releasesEnabled}
      filterPills={
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-3 py-3 sm:px-4 md:px-6 mx-auto w-full max-w-screen-2xl">
            {views.map((view) => {
              const Icon = view.icon;
              return (
                <button
                  type="button"
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  className={`filter-pill haptic-press ${activeView === view.key ? "active" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {view.label}
                  {view.count !== undefined && (
                    <span className="count">{view.count}</span>
                  )}
                </button>
              );
            })}
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSubmissionDialog(true)}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Submit Release
            </Button>
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      }
    >
      {activeView === "new" &&
        (filteredNewReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
            <div
              className="absolute inset-0 -z-10 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)",
              }}
            />
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
              style={{
                background:
                  "linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)",
                boxShadow:
                  "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)",
              }}
            >
              <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              No new releases found
            </h2>
            <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
              {searchQuery
                ? "Try a different search"
                : "Check back soon for new comic releases"}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
            }}
          >
            {filteredNewReleases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                isInPullList={pullList.isInList(release.id)}
                isSeriesSubscribed={pullList.isSubscribedToSeries(
                  release.series,
                )}
              />
            ))}
          </div>
        ))}

      {activeView === "upcoming" &&
        (filteredUpcomingReleases.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
            <div
              className="absolute inset-0 -z-10 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)",
              }}
            />
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
              style={{
                background:
                  "linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)",
                boxShadow:
                  "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)",
              }}
            >
              <Clock className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-foreground">
              No upcoming releases found
            </h2>
            <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
              {searchQuery
                ? "Try a different search"
                : "Check back soon for upcoming releases"}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
            }}
          >
            {filteredUpcomingReleases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                isInPullList={pullList.isInList(release.id)}
                isSeriesSubscribed={pullList.isSubscribedToSeries(
                  release.series,
                )}
              />
            ))}
          </div>
        ))}

      {activeView === "calendar" && (
        <div className="mx-auto max-w-5xl">
          {/* Calendar Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="mb-6 rounded-lg border border-border bg-card overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square border-b border-r border-border p-2"
                    />
                  );
                }

                const dayReleases = getReleasesForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      group relative aspect-square border-b border-r border-border p-2 text-left transition-colors
                      hover:bg-muted/50
                      ${isSelected ? "bg-primary/10" : ""}
                      ${isToday ? "bg-accent/50" : ""}
                    `}
                  >
                    <span
                      className={`text-sm ${isToday ? "font-bold text-primary" : "text-foreground"}`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayReleases.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {dayReleases.slice(0, 3).map((release) => (
                          <div
                            key={release.id}
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                            title={release.title}
                          />
                        ))}
                        {dayReleases.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{dayReleases.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Releases */}
          {selectedDate && (
            <div>
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Releases on {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              {selectedDateReleases.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    No releases on this date
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
                  }}
                >
                  {selectedDateReleases.map((release) => (
                    <ReleaseCard
                      key={release.id}
                      release={release}
                      isInPullList={pullList.isInList(release.id)}
                      isSeriesSubscribed={pullList.isSubscribedToSeries(
                        release.series,
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeView === "pull-list" && (
        <PullListView releases={releases} pullList={pullList} />
      )}

      <ReleaseSubmissionDialog
        open={showSubmissionDialog}
        onOpenChange={setShowSubmissionDialog}
      />
    </AppLayout>
  );
}

function PullListView({
  releases,
  pullList,
}: {
  releases: Release[];
  pullList: ReturnType<typeof usePullList>;
}) {
  const pullListReleases = useMemo(() => {
    return releases.filter((release) => pullList.isInList(release.id));
  }, [releases, pullList]);

  const subscribedReleases = useMemo(() => {
    const pullListIds = new Set(pullList.items.map((item) => item.releaseId));
    return releases.filter(
      (release) =>
        pullList.isSubscribedToSeries(release.series) &&
        !pullListIds.has(release.id),
    );
  }, [releases, pullList]);

  const groupedBySubscription = useMemo(() => {
    const groups: Record<string, Release[]> = {};
    subscribedReleases.forEach((release) => {
      if (!groups[release.series]) {
        groups[release.series] = [];
      }
      groups[release.series].push(release);
    });
    return groups;
  }, [subscribedReleases]);

  const hasItems =
    pullListReleases.length > 0 || pullList.subscriptions.length > 0;

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)",
          }}
        />
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
          style={{
            background:
              "linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)",
            boxShadow:
              "0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)",
          }}
        >
          <Heart className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-foreground">
          Your Pull List is empty
        </h2>
        <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
          Add individual releases or subscribe to series to build your pull list
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pullListReleases.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-primary fill-current" />
            <h2 className="text-xl font-bold text-foreground">
              Individual Releases ({pullListReleases.length})
            </h2>
          </div>
          <div
            className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
            }}
          >
            {pullListReleases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                isInPullList={true}
                isSeriesSubscribed={pullList.isSubscribedToSeries(
                  release.series,
                )}
              />
            ))}
          </div>
        </div>
      )}

      {pullList.subscriptions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground fill-current" />
            <h2 className="text-xl font-bold text-foreground">
              Series Subscriptions ({pullList.subscriptions.length})
            </h2>
          </div>

          {pullList.subscriptions.map((subscription) => {
            const seriesReleases =
              groupedBySubscription[subscription.seriesName] || [];
            return (
              <div key={subscription.seriesName} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {subscription.seriesName}
                  </h3>
                  <Badge variant="secondary">
                    {seriesReleases.length}{" "}
                    {seriesReleases.length === 1 ? "release" : "releases"}
                  </Badge>
                </div>
                {seriesReleases.length > 0 ? (
                  <div
                    className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
                    }}
                  >
                    {seriesReleases.map((release) => (
                      <ReleaseCard
                        key={release.id}
                        release={release}
                        isInPullList={pullList.isInList(release.id)}
                        isSeriesSubscribed={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No releases currently available for this series
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReleaseCard({
  release,
  isInPullList = false,
  isSeriesSubscribed = false,
}: {
  release: Release;
  isInPullList?: boolean;
  isSeriesSubscribed?: boolean;
}) {
  return (
    <Link
      href={`/releases/${release.slug}`}
      className="comic-card group relative rounded-2xl overflow-hidden cursor-pointer block"
    >
      {/* Cover Image */}
      <div className="relative aspect-[2/3] overflow-hidden bg-muted rounded-t-2xl">
        <img
          src={release.coverUrl}
          alt={release.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Pull List Indicators */}
        {(isInPullList || isSeriesSubscribed) && (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5">
            {isInPullList && (
              <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                <Heart className="h-3.5 w-3.5 fill-current" />
              </div>
            )}
            {isSeriesSubscribed && (
              <div className="bg-accent text-foreground rounded-full p-1.5 shadow-lg border border-border">
                <Bell className="h-3.5 w-3.5 fill-current" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-3.5 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {release.title}
        </h3>

        <p className="text-xs text-muted-foreground truncate">
          {release.publisher}
        </p>

        {/* Release date and price */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-xs text-muted-foreground">
            {format(new Date(release.releaseDate), "MMM d, yyyy")}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {release.price}
          </span>
        </div>
      </div>
    </Link>
  );
}
