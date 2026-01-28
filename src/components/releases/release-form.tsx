"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { releaseSchema, type ReleaseFormData, type ReleaseFormInput, getDefaultReleaseFormData } from "@/lib/releases-schemas"
import type { Release, Publisher, Genre, Format } from "@/lib/releases-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, X, Plus } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ReleaseFormProps {
  release?: Release
  publishers: Publisher[]
  genres: Genre[]
  formats: Format[]
  series: { slug: string; name: string }[]
  onSubmit: (data: ReleaseFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function ReleaseForm({
  release,
  publishers,
  genres,
  formats,
  series,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ReleaseFormProps) {
  const [writerInput, setWriterInput] = useState("")
  const [artistInput, setArtistInput] = useState("")
  const [tagInput, setTagInput] = useState("")

  const form = useForm<ReleaseFormInput>({
    resolver: zodResolver(releaseSchema),
    defaultValues: release
      ? {
          title: release.title,
          series: release.series,
          issueNumber: release.issueNumber,
          releaseDate: new Date(release.releaseDate),
          coverUrl: release.coverUrl,
          publisher: release.publisher,
          writers: release.writers,
          artists: release.artists,
          description: release.description || "",
          price: release.price,
          format: release.format,
          genres: release.genres,
          status: release.status,
          tags: release.tags || [],
          pageCount: release.pageCount,
          printRun: release.printRun,
          variants: release.variants,
          isbn: release.isbn,
          diamond: release.diamond,
          upc: release.upc,
          ageRating: release.ageRating,
        }
      : getDefaultReleaseFormData(),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const writers = watch("writers") || []
  const artists = watch("artists") || []
  const selectedGenres = watch("genres") || []
  const tags = watch("tags") || []
  const releaseDate = watch("releaseDate")

  const addWriter = () => {
    if (writerInput.trim()) {
      setValue("writers", [...writers, writerInput.trim()])
      setWriterInput("")
    }
  }

  const removeWriter = (index: number) => {
    setValue(
      "writers",
      writers.filter((_, i) => i !== index)
    )
  }

  const addArtist = () => {
    if (artistInput.trim()) {
      setValue("artists", [...artists, artistInput.trim()])
      setArtistInput("")
    }
  }

  const removeArtist = (index: number) => {
    setValue(
      "artists",
      artists.filter((_, i) => i !== index)
    )
  }

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      setValue(
        "genres",
        selectedGenres.filter((g) => g !== genreId)
      )
    } else {
      setValue("genres", [...selectedGenres, genreId])
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    setValue(
      "tags",
      tags.filter((_, i) => i !== index)
    )
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data as ReleaseFormData))} className="space-y-6">
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Batman #153"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="series">Series *</Label>
              <Select
                value={watch("series")}
                onValueChange={(value) => setValue("series", value)}
              >
                <SelectTrigger className={errors.series ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select series" />
                </SelectTrigger>
                <SelectContent>
                  {series.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.series && (
                <p className="text-xs text-destructive mt-1">{errors.series.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="issueNumber">Issue Number *</Label>
              <Input
                id="issueNumber"
                {...register("issueNumber")}
                placeholder="153"
                className={errors.issueNumber ? "border-destructive" : ""}
              />
              {errors.issueNumber && (
                <p className="text-xs text-destructive mt-1">
                  {errors.issueNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Publisher and Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="publisher">Publisher *</Label>
              <Select
                value={watch("publisher")}
                onValueChange={(value) => setValue("publisher", value)}
              >
                <SelectTrigger className={errors.publisher ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select publisher" />
                </SelectTrigger>
                <SelectContent>
                  {publishers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.publisher && (
                <p className="text-xs text-destructive mt-1">
                  {errors.publisher.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="format">Format *</Label>
              <Select
                value={watch("format")}
                onValueChange={(value) =>
                  setValue("format", value as ReleaseFormData["format"])
                }
              >
                <SelectTrigger className={errors.format ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.format && (
                <p className="text-xs text-destructive mt-1">{errors.format.message}</p>
              )}
            </div>
          </div>

          {/* Release Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Release Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !releaseDate && "text-muted-foreground",
                      errors.releaseDate && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {releaseDate ? format(releaseDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={releaseDate}
                    onSelect={(date) => date && setValue("releaseDate", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.releaseDate && (
                <p className="text-xs text-destructive mt-1">
                  {errors.releaseDate.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) =>
                  setValue("status", value as ReleaseFormData["status"])
                }
              >
                <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Price and Cover URL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                {...register("price")}
                placeholder="$4.99"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-xs text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="coverUrl">Cover URL</Label>
              <Input
                id="coverUrl"
                {...register("coverUrl")}
                placeholder="https://..."
                className={errors.coverUrl ? "border-destructive" : ""}
              />
              {errors.coverUrl && (
                <p className="text-xs text-destructive mt-1">{errors.coverUrl.message}</p>
              )}
            </div>
          </div>

          {/* Writers */}
          <div>
            <Label>Writers *</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={writerInput}
                onChange={(e) => setWriterInput(e.target.value)}
                placeholder="Add a writer"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addWriter()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addWriter}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {writers.map((writer, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {writer}
                  <button
                    type="button"
                    onClick={() => removeWriter(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {errors.writers && (
              <p className="text-xs text-destructive mt-1">{errors.writers.message}</p>
            )}
          </div>

          {/* Artists */}
          <div>
            <Label>Artists *</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={artistInput}
                onChange={(e) => setArtistInput(e.target.value)}
                placeholder="Add an artist"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addArtist()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addArtist}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {artists.map((artist, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {artist}
                  <button
                    type="button"
                    onClick={() => removeArtist(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            {errors.artists && (
              <p className="text-xs text-destructive mt-1">{errors.artists.message}</p>
            )}
          </div>

          {/* Genres */}
          <div>
            <Label>Genres</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {genres.map((genre) => (
                <Badge
                  key={genre.id}
                  variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre.id)}
                >
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter a description..."
              rows={4}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : release ? "Update Release" : "Create Release"}
        </Button>
      </div>
    </form>
  )
}
