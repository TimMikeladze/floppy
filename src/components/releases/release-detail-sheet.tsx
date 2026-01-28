"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Release, Publisher } from "@/lib/releases-types"
import { format } from "date-fns"
import {
  Heart,
  Bell,
  Calendar,
  DollarSign,
  BookOpen,
  User,
  Palette,
  Tag,
} from "lucide-react"

interface ReleaseDetailSheetProps {
  release: Release | null
  publisher?: Publisher
  open: boolean
  onOpenChange: (open: boolean) => void
  isInPullList?: boolean
  isSeriesSubscribed?: boolean
  onTogglePullList?: () => void
  onToggleSubscription?: () => void
}

export function ReleaseDetailSheet({
  release,
  publisher,
  open,
  onOpenChange,
  isInPullList = false,
  isSeriesSubscribed = false,
  onTogglePullList,
  onToggleSubscription,
}: ReleaseDetailSheetProps) {
  if (!release) return null

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/10 text-blue-500",
    released: "bg-green-500/10 text-green-500",
    delayed: "bg-yellow-500/10 text-yellow-500",
    cancelled: "bg-red-500/10 text-red-500",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl">{release.title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4 mt-4">
          <div className="space-y-6">
            {/* Status */}
            <Badge className={statusColors[release.status] || ""}>
              {release.status.charAt(0).toUpperCase() + release.status.slice(1)}
            </Badge>

            {/* Pull List Actions */}
            <div className="flex gap-2">
              {onTogglePullList && (
                <Button
                  variant={isInPullList ? "default" : "outline"}
                  className="flex-1"
                  onClick={onTogglePullList}
                >
                  <Heart
                    className={`h-4 w-4 mr-2 ${isInPullList ? "fill-current" : ""}`}
                  />
                  {isInPullList ? "In Pull List" : "Add to Pull List"}
                </Button>
              )}
              {onToggleSubscription && (
                <Button
                  variant={isSeriesSubscribed ? "default" : "outline"}
                  className="flex-1"
                  onClick={onToggleSubscription}
                >
                  <Bell
                    className={`h-4 w-4 mr-2 ${isSeriesSubscribed ? "fill-current" : ""}`}
                  />
                  {isSeriesSubscribed ? "Subscribed" : "Subscribe"}
                </Button>
              )}
            </div>

            {/* Cover Image */}
            {release.coverUrl && (
              <div className="aspect-[2/3] max-w-xs mx-auto overflow-hidden rounded-lg bg-muted">
                <img
                  src={release.coverUrl}
                  alt={release.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <Separator />

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
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
                  <p className="text-sm font-medium">{publisher?.name || release.publisher}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Creators */}
            <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground mb-2">Description</p>
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
                  <p className="text-xs text-muted-foreground mb-2">Variant Covers</p>
                  <div className="grid grid-cols-3 gap-2">
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
                        <p className="text-xs text-center truncate">{variant.name}</p>
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
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
