"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Bell
} from "lucide-react"
import {
  getNewReleases,
  getUpcomingReleases,
  getAllReleasesForMonth,
  getReleasesByDate,
  type Release,
  mockReleases
} from "@/lib/mock-releases"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import { usePullList } from "@/hooks/use-pull-list"
import { getStoredReleasesPreferences, saveReleasesPreferences } from "@/hooks/use-releases-preferences"

const viewTypes = ["new", "upcoming", "calendar", "pull-list"] as const
type ViewType = (typeof viewTypes)[number]

interface ReleasesContentProps {
  releasesEnabled: boolean
}

export function ReleasesContent({ releasesEnabled }: ReleasesContentProps) {
  const [searchQuery, setSearchQuery] = useQueryState("q", parseAsString.withDefault(""))
  const [activeView, setActiveView] = useQueryState("view", parseAsStringLiteral(viewTypes).withDefault("new"))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Track if we've initialized from localStorage
  const hasInitializedFromStorage = useRef(false)

  // Initialize from localStorage if no URL params are present
  useEffect(() => {
    if (hasInitializedFromStorage.current) return
    hasInitializedFromStorage.current = true

    // Check if URL has the view param
    const urlParams = new URLSearchParams(window.location.search)
    const hasViewParam = urlParams.has("view")

    // If no URL param, load from localStorage
    if (!hasViewParam) {
      const stored = getStoredReleasesPreferences()
      if (stored.view !== "new") setActiveView(stored.view)
    }
  }, [setActiveView])

  // Persist preferences to localStorage when they change
  useEffect(() => {
    if (!hasInitializedFromStorage.current) return

    saveReleasesPreferences({
      view: activeView as "new" | "upcoming" | "calendar" | "pull-list",
    })
  }, [activeView])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const pullList = usePullList()

  const newReleases = useMemo(() => getNewReleases(), [])
  const upcomingReleases = useMemo(() => getUpcomingReleases(), [])
  const monthReleases = useMemo(
    () => getAllReleasesForMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  )

  const filterReleases = (releases: Release[]) => {
    if (!searchQuery) return releases
    const query = searchQuery.toLowerCase()
    return releases.filter(
      (release) =>
        release.title.toLowerCase().includes(query) ||
        release.series.toLowerCase().includes(query) ||
        release.publisher.toLowerCase().includes(query) ||
        release.writer.some(w => w.toLowerCase().includes(query)) ||
        release.artist.some(a => a.toLowerCase().includes(query))
    )
  }

  const filteredNewReleases = filterReleases(newReleases)
  const filteredUpcomingReleases = filterReleases(upcomingReleases)

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Pad beginning to start on Sunday
    const startDay = start.getDay()
    const paddingStart = Array(startDay).fill(null)

    return [...paddingStart, ...days]
  }, [currentMonth])

  const selectedDateReleases = useMemo(() => {
    if (!selectedDate) return []
    return getReleasesByDate(selectedDate)
  }, [selectedDate])

  const handleReleaseClick = (release: Release) => {
    setSelectedRelease(release)
    setDialogOpen(true)
  }

  // Calculate pull list items count
  const pullListReleasesCount = useMemo(() => {
    const uniqueReleaseIds = new Set(pullList.items.map(item => item.releaseId))
    const subscribedReleases = mockReleases.filter(release =>
      pullList.subscriptions.some(sub => sub.seriesName === release.series)
    )
    return uniqueReleaseIds.size + subscribedReleases.length
  }, [pullList.items, pullList.subscriptions])

  const views = [
    { key: "new" as const, label: "New Releases", icon: Sparkles, count: filteredNewReleases.length },
    { key: "upcoming" as const, label: "Upcoming", icon: Clock, count: filteredUpcomingReleases.length },
    { key: "calendar" as const, label: "Calendar", icon: CalendarIcon },
    { key: "pull-list" as const, label: "Pull List", icon: Heart, count: pullListReleasesCount }
  ]

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
              const Icon = view.icon
              return (
                <button
                  key={view.key}
                  onClick={() => setActiveView(view.key)}
                  className={`filter-pill haptic-press ${activeView === view.key ? "active" : ""}`}
                >
                  <Icon className="h-4 w-4" />
                  {view.label}
                  {view.count !== undefined && <span className="count">{view.count}</span>}
                </button>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      }
    >
        {activeView === "new" && (
          filteredNewReleases.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
              <div
                className="absolute inset-0 -z-10 opacity-40"
                style={{
                  background: 'radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)'
                }}
              />
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
                style={{
                  background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
                  boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)'
                }}
              >
                <Sparkles className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">No new releases found</h2>
              <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
                {searchQuery ? "Try a different search" : "Check back soon for new comic releases"}
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
              }}
            >
              {filteredNewReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onClick={() => handleReleaseClick(release)}
                  isInPullList={pullList.isInList(release.id)}
                  isSeriesSubscribed={pullList.isSubscribedToSeries(release.series)}
                />
              ))}
            </div>
          )
        )}

        {activeView === "upcoming" && (
          filteredUpcomingReleases.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
              <div
                className="absolute inset-0 -z-10 opacity-40"
                style={{
                  background: 'radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)'
                }}
              />
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
                style={{
                  background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
                  boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)'
                }}
              >
                <Clock className="w-12 h-12 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-foreground">No upcoming releases found</h2>
              <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
                {searchQuery ? "Try a different search" : "Check back soon for upcoming releases"}
              </p>
            </div>
          ) : (
            <div
              className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
              }}
            >
              {filteredUpcomingReleases.map((release) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  onClick={() => handleReleaseClick(release)}
                  isInPullList={pullList.isInList(release.id)}
                  isSeriesSubscribed={pullList.isSubscribedToSeries(release.series)}
                />
              ))}
            </div>
          )
        )}

        {activeView === "calendar" && (
          <div className="mx-auto max-w-5xl">
            {/* Calendar Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
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
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
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
                    return <div key={`empty-${index}`} className="aspect-square border-b border-r border-border p-2" />
                  }

                  const dayReleases = getReleasesByDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        group relative aspect-square border-b border-r border-border p-2 text-left transition-colors
                        hover:bg-muted/50
                        ${isSelected ? 'bg-primary/10' : ''}
                        ${isToday ? 'bg-accent/50' : ''}
                      `}
                    >
                      <span className={`text-sm ${isToday ? 'font-bold text-primary' : 'text-foreground'}`}>
                        {format(day, 'd')}
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
                  )
                })}
              </div>
            </div>

            {/* Selected Date Releases */}
            {selectedDate && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                  Releases on {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                {selectedDateReleases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No releases on this date</p>
                  </div>
                ) : (
                  <div
                    className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                    style={{
                      gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
                    }}
                  >
                    {selectedDateReleases.map((release) => (
                      <ReleaseCard
                        key={release.id}
                        release={release}
                        onClick={() => handleReleaseClick(release)}
                        isInPullList={pullList.isInList(release.id)}
                        isSeriesSubscribed={pullList.isSubscribedToSeries(release.series)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === "pull-list" && (
          <PullListView
            pullList={pullList}
            onReleaseClick={handleReleaseClick}
          />
        )}

      {/* Release Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedRelease?.title}</DialogTitle>
          </DialogHeader>

          {selectedRelease && (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6">
                {/* Pull List Actions */}
                <div className="flex gap-2">
                  <Button
                    variant={pullList.isInList(selectedRelease.id) ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => pullList.togglePullListItem(selectedRelease.id)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${pullList.isInList(selectedRelease.id) ? 'fill-current' : ''}`} />
                    {pullList.isInList(selectedRelease.id) ? "In Pull List" : "Add to Pull List"}
                  </Button>
                  <Button
                    variant={pullList.isSubscribedToSeries(selectedRelease.series) ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => pullList.toggleSeriesSubscription(selectedRelease.series)}
                  >
                    <Bell className={`h-4 w-4 mr-2 ${pullList.isSubscribedToSeries(selectedRelease.series) ? 'fill-current' : ''}`} />
                    {pullList.isSubscribedToSeries(selectedRelease.series) ? "Subscribed" : "Subscribe to Series"}
                  </Button>
                </div>
                {/* Cover Image */}
                <div className="aspect-[2/3] max-w-xs mx-auto overflow-hidden rounded-lg">
                  <img
                    src={selectedRelease.coverUrl}
                    alt={selectedRelease.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Publisher
                    </p>
                    <p className="text-sm font-medium">{selectedRelease.publisher}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Release Date
                    </p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedRelease.releaseDate), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Price
                    </p>
                    <p className="text-sm font-medium">{selectedRelease.price}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Format
                    </p>
                    <p className="text-sm font-medium capitalize">
                      {selectedRelease.format.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                {/* Series Info */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Series
                  </p>
                  <p className="text-sm font-medium">
                    {selectedRelease.series} {selectedRelease.issueNumber}
                  </p>
                </div>

                {/* Creators */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Writer{selectedRelease.writer.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm">{selectedRelease.writer.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Artist{selectedRelease.artist.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm">{selectedRelease.artist.join(', ')}</p>
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Genres
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRelease.genre.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed">{selectedRelease.description}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

function PullListView({
  pullList,
  onReleaseClick,
}: {
  pullList: ReturnType<typeof usePullList>
  onReleaseClick: (release: Release) => void
}) {
  // Get all releases that are in the pull list
  const pullListReleases = useMemo(() => {
    return mockReleases.filter((release) => pullList.isInList(release.id))
  }, [pullList.items])

  // Get all releases from subscribed series (excluding already in pull list)
  const subscribedReleases = useMemo(() => {
    const pullListIds = new Set(pullList.items.map((item) => item.releaseId))
    return mockReleases.filter(
      (release) =>
        pullList.isSubscribedToSeries(release.series) && !pullListIds.has(release.id)
    )
  }, [pullList.subscriptions, pullList.items])

  // Group subscribed releases by series
  const groupedBySubscription = useMemo(() => {
    const groups: Record<string, Release[]> = {}
    subscribedReleases.forEach((release) => {
      if (!groups[release.series]) {
        groups[release.series] = []
      }
      groups[release.series].push(release)
    })
    return groups
  }, [subscribedReleases])

  const hasItems = pullListReleases.length > 0 || pullList.subscriptions.length > 0

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center relative">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 50% 40%, oklch(0.78 0.12 70 / 0.15) 0%, transparent 70%)'
          }}
        />
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 relative"
          style={{
            background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
            boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border), inset 0 1px 0 oklch(1 0 0 / 0.05)'
          }}
        >
          <Heart className="w-12 h-12 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-foreground">Your Pull List is empty</h2>
        <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
          Add individual releases or subscribe to series to build your pull list
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Individual Pull List Items */}
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
              gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
            }}
          >
            {pullListReleases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                onClick={() => onReleaseClick(release)}
                isInPullList={true}
                isSeriesSubscribed={pullList.isSubscribedToSeries(release.series)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Subscribed Series */}
      {pullList.subscriptions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-muted-foreground fill-current" />
            <h2 className="text-xl font-bold text-foreground">
              Series Subscriptions ({pullList.subscriptions.length})
            </h2>
          </div>

          {pullList.subscriptions.map((subscription) => {
            const seriesReleases = groupedBySubscription[subscription.seriesName] || []
            return (
              <div key={subscription.seriesName} className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {subscription.seriesName}
                  </h3>
                  <Badge variant="secondary">
                    {seriesReleases.length} {seriesReleases.length === 1 ? 'release' : 'releases'}
                  </Badge>
                </div>
                {seriesReleases.length > 0 ? (
                  <div
                    className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                    style={{
                      gridTemplateColumns: "repeat(auto-fill, minmax(min(140px, 100%), 1fr))",
                    }}
                  >
                    {seriesReleases.map((release) => (
                      <ReleaseCard
                        key={release.id}
                        release={release}
                        onClick={() => onReleaseClick(release)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}

function ReleaseCard({
  release,
  onClick,
  isInPullList = false,
  isSeriesSubscribed = false
}: {
  release: Release
  onClick: () => void
  isInPullList?: boolean
  isSeriesSubscribed?: boolean
}) {
  return (
    <div
      className="comic-card group relative rounded-2xl overflow-hidden cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
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
            {format(new Date(release.releaseDate), 'MMM d, yyyy')}
          </span>
          <span className="text-xs font-semibold text-foreground">
            {release.price}
          </span>
        </div>
      </div>
    </div>
  )
}
