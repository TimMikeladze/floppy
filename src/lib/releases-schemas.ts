import { z } from "zod"

export const variantCoverSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  coverUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  artist: z.string().optional(),
})

export const releaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  series: z.string().min(1, "Series is required"),
  issueNumber: z.string().min(1, "Issue number is required"),
  releaseDate: z.date({ error: "Release date is required" }),
  coverUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  publisher: z.string().min(1, "Publisher is required"),
  writers: z.array(z.string()).min(1, "At least one writer is required"),
  artists: z.array(z.string()).min(1, "At least one artist is required"),
  description: z.string().default(""),
  price: z
    .string()
    .regex(/^\$?\d+\.?\d*$/, "Invalid price format (e.g., $4.99)")
    .or(z.literal("")),
  format: z.enum(["single-issue", "trade-paperback", "hardcover", "omnibus"]),
  genres: z.array(z.string()),
  pageCount: z.number().positive("Page count must be positive").optional(),
  printRun: z.number().positive("Print run must be positive").optional(),
  variants: z.array(variantCoverSchema).optional(),
  status: z.enum(["upcoming", "released", "delayed", "cancelled"]),
  isbn: z.string().optional(),
  diamond: z.string().optional(),
  upc: z.string().optional(),
  ageRating: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const seriesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  publisher: z.string().min(1, "Publisher is required"),
  startYear: z.number().min(1900, "Start year must be after 1900"),
  currentVolume: z.number().positive().optional(),
  volumeStartYear: z.number().min(1900).optional(),
  status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]),
  genres: z.array(z.string()),
  description: z.string().default(""),
  coverUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  currentWriters: z.array(z.string()).optional().default([]),
  currentArtists: z.array(z.string()).optional().default([]),
  releaseSchedule: z.enum([
    "weekly",
    "biweekly",
    "monthly",
    "bimonthly",
    "irregular",
  ]),
  typicalReleaseDay: z.string().optional(),
  relatedSeries: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export type ReleaseFormData = z.infer<typeof releaseSchema>
export type SeriesFormData = z.infer<typeof seriesSchema>
export type VariantCoverFormData = z.infer<typeof variantCoverSchema>

// Input type for form (before Zod transforms)
export type ReleaseFormInput = z.input<typeof releaseSchema>

// Helper to create a default release form data
export function getDefaultReleaseFormData(): ReleaseFormInput {
  return {
    title: "",
    series: "",
    issueNumber: "",
    releaseDate: new Date(),
    coverUrl: "",
    publisher: "",
    writers: [],
    artists: [],
    description: "",
    price: "",
    format: "single-issue",
    genres: [],
    status: "upcoming",
    tags: [],
  }
}

// Helper to create a default series form data
export function getDefaultSeriesFormData(): Partial<SeriesFormData> {
  return {
    name: "",
    slug: "",
    publisher: "",
    startYear: new Date().getFullYear(),
    status: "ongoing",
    genres: [],
    description: "",
    coverUrl: "",
    currentWriters: [],
    currentArtists: [],
    releaseSchedule: "monthly",
    tags: [],
  }
}
