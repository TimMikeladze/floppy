"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import {
  CalendarIcon,
  Plus,
  X,
  Copy,
  Check,
  Send,
  FileText,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  releaseSchema,
  getDefaultReleaseFormData,
  type ReleaseFormData,
} from "@/lib/releases-schemas"
import type { ReleaseFormat, ReleaseStatus } from "@/lib/releases-types"

interface ReleaseSubmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FORMAT_OPTIONS: { value: ReleaseFormat; label: string }[] = [
  { value: "single-issue", label: "Single Issue" },
  { value: "trade-paperback", label: "Trade Paperback" },
  { value: "hardcover", label: "Hardcover" },
  { value: "omnibus", label: "Omnibus" },
]

const STATUS_OPTIONS: { value: ReleaseStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "released", label: "Released" },
  { value: "delayed", label: "Delayed" },
  { value: "cancelled", label: "Cancelled" },
]

const COMMON_PUBLISHERS = [
  "Marvel Comics",
  "DC Comics",
  "Image Comics",
  "Dark Horse Comics",
  "IDW Publishing",
  "BOOM! Studios",
  "Dynamite Entertainment",
  "Valiant Comics",
  "Oni Press",
  "Aftershock Comics",
]

const COMMON_GENRES = [
  "Superhero",
  "Action",
  "Adventure",
  "Horror",
  "Sci-Fi",
  "Fantasy",
  "Crime",
  "Mystery",
  "Romance",
  "Comedy",
  "Drama",
  "Slice of Life",
]

function generateSlug(title: string, series: string, issueNumber: string): string {
  const base = `${series}-${issueNumber}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base
}

function generateYaml(data: ReleaseFormData): string {
  const slug = generateSlug(data.title, data.series, data.issueNumber)

  const lines: string[] = [
    `- slug: "${slug}"`,
    `  title: "${data.title}"`,
    `  series: "${data.series}"`,
    `  issueNumber: "${data.issueNumber}"`,
    `  releaseDate: "${format(data.releaseDate, "yyyy-MM-dd")}"`,
    `  coverUrl: "${data.coverUrl || ""}"`,
    `  publisher: "${data.publisher}"`,
    `  writers:`,
    ...data.writers.map((w) => `    - "${w}"`),
    `  artists:`,
    ...data.artists.map((a) => `    - "${a}"`),
    `  description: "${data.description?.replace(/"/g, '\\"') || ""}"`,
    `  price: "${data.price || ""}"`,
    `  format: "${data.format}"`,
    `  genres:`,
    ...data.genres.map((g) => `    - "${g}"`),
    `  status: "${data.status}"`,
  ]

  if (data.pageCount) {
    lines.push(`  pageCount: ${data.pageCount}`)
  }
  if (data.isbn) {
    lines.push(`  isbn: "${data.isbn}"`)
  }
  if (data.diamond) {
    lines.push(`  diamond: "${data.diamond}"`)
  }
  if (data.upc) {
    lines.push(`  upc: "${data.upc}"`)
  }
  if (data.ageRating) {
    lines.push(`  ageRating: "${data.ageRating}"`)
  }
  if (data.tags && data.tags.length > 0) {
    lines.push(`  tags:`)
    data.tags.forEach((t) => lines.push(`    - "${t}"`))
  }

  return lines.join("\n")
}

export function ReleaseSubmissionDialog({
  open,
  onOpenChange,
}: ReleaseSubmissionDialogProps) {
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form")
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Array field inputs
  const [writerInput, setWriterInput] = useState("")
  const [artistInput, setArtistInput] = useState("")
  const [tagInput, setTagInput] = useState("")

  const form = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseSchema),
    defaultValues: getDefaultReleaseFormData(),
  })

  const formValues = form.watch()
  const isValid = form.formState.isValid

  const yamlOutput = useMemo(() => {
    if (!formValues.title || !formValues.series || !formValues.issueNumber) {
      return "// Fill in required fields to see preview"
    }
    try {
      return generateYaml(formValues)
    } catch {
      return "// Error generating YAML"
    }
  }, [formValues])

  const handleAddWriter = () => {
    if (writerInput.trim()) {
      const current = form.getValues("writers") || []
      form.setValue("writers", [...current, writerInput.trim()], { shouldValidate: true })
      setWriterInput("")
    }
  }

  const handleRemoveWriter = (index: number) => {
    const current = form.getValues("writers") || []
    form.setValue("writers", current.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleAddArtist = () => {
    if (artistInput.trim()) {
      const current = form.getValues("artists") || []
      form.setValue("artists", [...current, artistInput.trim()], { shouldValidate: true })
      setArtistInput("")
    }
  }

  const handleRemoveArtist = (index: number) => {
    const current = form.getValues("artists") || []
    form.setValue("artists", current.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const current = form.getValues("tags") || []
      form.setValue("tags", [...current, tagInput.trim()], { shouldValidate: true })
      setTagInput("")
    }
  }

  const handleRemoveTag = (index: number) => {
    const current = form.getValues("tags") || []
    form.setValue("tags", current.filter((_, i) => i !== index), { shouldValidate: true })
  }

  const handleToggleGenre = (genre: string) => {
    const current = form.getValues("genres") || []
    if (current.includes(genre)) {
      form.setValue("genres", current.filter((g) => g !== genre), { shouldValidate: true })
    } else {
      form.setValue("genres", [...current, genre], { shouldValidate: true })
    }
  }

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yamlOutput)
      setCopied(true)
      toast.success("YAML copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleSubmit = async () => {
    const result = await form.trigger()
    if (!result) {
      toast.error("Please fix the validation errors")
      setActiveTab("form")
      return
    }

    setSubmitting(true)
    try {
      // In a real implementation, this would send to an API
      // For now, we'll copy to clipboard and show success
      await navigator.clipboard.writeText(yamlOutput)
      toast.success(
        "Submission copied to clipboard! Share this YAML with the admin team to add this release to the database.",
        { duration: 5000 }
      )
      onOpenChange(false)
      form.reset(getDefaultReleaseFormData())
    } catch {
      toast.error("Failed to submit. Please try copying the YAML manually.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form after a short delay to avoid flashing
    setTimeout(() => {
      form.reset(getDefaultReleaseFormData())
      setActiveTab("form")
    }, 200)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Submit a New Release</DialogTitle>
          <DialogDescription>
            Fill out the release information below. Once submitted, the admin team will review and add it to the global releases database.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "form" | "preview")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">
              <FileText className="w-4 h-4 mr-2" />
              Form
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Copy className="w-4 h-4 mr-2" />
              Preview YAML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <div className="grid gap-6 pb-4">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Basic Information
                  </h3>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g., Amazing Spider-Man #1"
                        {...form.register("title")}
                      />
                      {form.formState.errors.title && (
                        <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="series">
                          Series <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="series"
                          placeholder="e.g., Amazing Spider-Man"
                          {...form.register("series")}
                        />
                        {form.formState.errors.series && (
                          <p className="text-sm text-destructive">{form.formState.errors.series.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="issueNumber">
                          Issue # <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="issueNumber"
                          placeholder="e.g., 1"
                          {...form.register("issueNumber")}
                        />
                        {form.formState.errors.issueNumber && (
                          <p className="text-sm text-destructive">{form.formState.errors.issueNumber.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>
                          Release Date <span className="text-destructive">*</span>
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal",
                                !formValues.releaseDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formValues.releaseDate ? (
                                format(formValues.releaseDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formValues.releaseDate}
                              onSelect={(date) => date && form.setValue("releaseDate", date, { shouldValidate: true })}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          placeholder="e.g., $4.99"
                          {...form.register("price")}
                        />
                        {form.formState.errors.price && (
                          <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>
                          Publisher <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formValues.publisher}
                          onValueChange={(v) => form.setValue("publisher", v, { shouldValidate: true })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select publisher" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_PUBLISHERS.map((pub) => (
                              <SelectItem key={pub} value={pub}>
                                {pub}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.publisher && (
                          <p className="text-sm text-destructive">{form.formState.errors.publisher.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>
                          Format <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={formValues.format}
                          onValueChange={(v) => form.setValue("format", v as ReleaseFormat, { shouldValidate: true })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMAT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <Select
                        value={formValues.status}
                        onValueChange={(v) => form.setValue("status", v as ReleaseStatus, { shouldValidate: true })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Creators Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Creators
                  </h3>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>
                        Writers <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add writer name"
                          value={writerInput}
                          onChange={(e) => setWriterInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddWriter()
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleAddWriter}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formValues.writers && formValues.writers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formValues.writers.map((writer, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {writer}
                              <button
                                type="button"
                                onClick={() => handleRemoveWriter(index)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {form.formState.errors.writers && (
                        <p className="text-sm text-destructive">{form.formState.errors.writers.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>
                        Artists <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add artist name"
                          value={artistInput}
                          onChange={(e) => setArtistInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddArtist()
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleAddArtist}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formValues.artists && formValues.artists.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formValues.artists.map((artist, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {artist}
                              <button
                                type="button"
                                onClick={() => handleRemoveArtist(index)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {form.formState.errors.artists && (
                        <p className="text-sm text-destructive">{form.formState.errors.artists.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Details
                  </h3>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Brief description of this release..."
                        rows={3}
                        {...form.register("description")}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="coverUrl">Cover Image URL</Label>
                      <Input
                        id="coverUrl"
                        placeholder="https://example.com/cover.jpg"
                        {...form.register("coverUrl")}
                      />
                      {form.formState.errors.coverUrl && (
                        <p className="text-sm text-destructive">{form.formState.errors.coverUrl.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label>Genres</Label>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_GENRES.map((genre) => (
                          <Badge
                            key={genre}
                            variant={formValues.genres?.includes(genre) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleToggleGenre(genre)}
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddTag()
                            }
                          }}
                        />
                        <Button type="button" variant="outline" size="icon" onClick={handleAddTag}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {formValues.tags && formValues.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formValues.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(index)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Optional Identifiers
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="pageCount">Page Count</Label>
                      <Input
                        id="pageCount"
                        type="number"
                        placeholder="e.g., 32"
                        {...form.register("pageCount", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ageRating">Age Rating</Label>
                      <Input
                        id="ageRating"
                        placeholder="e.g., Teen+"
                        {...form.register("ageRating")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input
                        id="isbn"
                        placeholder="ISBN number"
                        {...form.register("isbn")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="diamond">Diamond Code</Label>
                      <Input
                        id="diamond"
                        placeholder="Diamond code"
                        {...form.register("diamond")}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="upc">UPC</Label>
                      <Input
                        id="upc"
                        placeholder="UPC code"
                        {...form.register("upc")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-4">
            <div className="relative h-[50vh]">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={handleCopyYaml}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <ScrollArea className="h-full rounded-md border bg-muted/50 p-4">
                <pre className="text-sm font-mono whitespace-pre-wrap">{yamlOutput}</pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Release
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
