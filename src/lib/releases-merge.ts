import type { Release, ReleaseYaml, Series, Publisher, Genre, Format, ReleasesConfig } from "./releases-types"
import {
  getReleaseOverrides,
  getCustomReleases,
  getDeletedReleaseIds,
} from "./storage"

// Try to import generated data, fallback to empty if not generated yet
let releasesData: {
  releases: ReleaseYaml[]
  series: Series[]
  config: {
    publishers: Publisher[]
    genres: Genre[]
    formats: Format[]
    settings: ReleasesConfig
  }
} = {
  releases: [],
  series: [],
  config: {
    publishers: [],
    genres: [],
    formats: [],
    settings: {
      defaultNewReleaseDays: 14,
      defaultUpcomingDays: 28,
      defaultCalendarMonths: 3,
      defaultPullListReminder: 3,
      enableVariantCovers: true,
      enablePriceAlerts: false,
      releaseDay: "wednesday",
    },
  },
}

// Dynamic import for generated data
async function loadGeneratedData() {
  try {
    const data = await import("@/generated")
    releasesData = data.releasesData
  } catch {
    console.warn("[releases-merge] Generated data not available yet. Run `npm run generate:releases` first.")
  }
}

// Initialize data on module load
loadGeneratedData()

/**
 * Convert a YAML release to a runtime Release object
 */
function yamlToRelease(yaml: ReleaseYaml): Release {
  return {
    ...yaml,
    id: yaml.id || `${yaml.series}-${yaml.releaseDate}-${yaml.issueNumber}`,
    releaseDate: new Date(yaml.releaseDate),
    isCustom: false,
    isModified: false,
  }
}

/**
 * Get all releases merged with user data (overrides, custom, deletions)
 */
export async function getMergedReleases(): Promise<Release[]> {
  // Make sure data is loaded
  await loadGeneratedData()

  // 1. Convert static YAML releases to runtime Release objects
  const staticReleases: Release[] = releasesData.releases.map(yamlToRelease)

  // 2. Load user data from IndexedDB
  const [overrides, deletions, customReleases] = await Promise.all([
    getReleaseOverrides(),
    getDeletedReleaseIds(),
    getCustomReleases(),
  ])

  // 3. Filter out deleted releases and apply overrides
  const mergedStatic = staticReleases
    .filter((r) => !deletions.includes(r.id))
    .map((r) => {
      const override = overrides.find((o) => o.releaseId === r.id)
      if (override) {
        return {
          ...r,
          ...override.overrides,
          releaseDate: override.overrides.releaseDate
            ? new Date(override.overrides.releaseDate)
            : r.releaseDate,
          isModified: true,
        }
      }
      return r
    })

  // 4. Add custom releases (already have dates as Date objects from storage)
  const allReleases = [...mergedStatic, ...customReleases]

  // 5. Sort by release date
  return allReleases.sort(
    (a, b) => a.releaseDate.getTime() - b.releaseDate.getTime()
  )
}

/**
 * Get releases config (publishers, genres, formats, settings)
 */
export async function getReleasesConfig() {
  await loadGeneratedData()
  return releasesData.config
}

/**
 * Get all series
 */
export async function getAllSeries(): Promise<Series[]> {
  await loadGeneratedData()
  return releasesData.series
}

/**
 * Get series by slug
 */
export async function getSeriesBySlug(slug: string): Promise<Series | undefined> {
  await loadGeneratedData()
  return releasesData.series.find((s) => s.slug === slug)
}

/**
 * Get publisher by ID/slug
 */
export async function getPublisherById(id: string): Promise<Publisher | undefined> {
  await loadGeneratedData()
  return releasesData.config.publishers.find((p) => p.id === id || p.slug === id)
}

/**
 * Get new releases (released within the last N days)
 */
export async function getNewReleases(days?: number): Promise<Release[]> {
  const config = await getReleasesConfig()
  const daysToCheck = days ?? config.settings.defaultNewReleaseDays

  const today = new Date()
  const cutoffDate = new Date(today.getTime() - daysToCheck * 24 * 60 * 60 * 1000)

  const releases = await getMergedReleases()
  return releases
    .filter((r) => r.releaseDate <= today && r.releaseDate >= cutoffDate)
    .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime())
}

/**
 * Get upcoming releases (releasing within the next N days)
 */
export async function getUpcomingReleases(days?: number): Promise<Release[]> {
  const config = await getReleasesConfig()
  const daysToCheck = days ?? config.settings.defaultUpcomingDays

  const today = new Date()
  const futureDate = new Date(today.getTime() + daysToCheck * 24 * 60 * 60 * 1000)

  const releases = await getMergedReleases()
  return releases
    .filter((r) => r.releaseDate > today && r.releaseDate <= futureDate)
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime())
}

/**
 * Get releases for a specific date
 */
export async function getReleasesByDate(date: Date): Promise<Release[]> {
  const releases = await getMergedReleases()
  return releases.filter((r) => r.releaseDate.toDateString() === date.toDateString())
}

/**
 * Get releases for a specific month
 */
export async function getReleasesForMonth(year: number, month: number): Promise<Release[]> {
  const releases = await getMergedReleases()
  return releases.filter((r) => {
    return r.releaseDate.getFullYear() === year && r.releaseDate.getMonth() === month
  })
}

/**
 * Get a single release by ID
 */
export async function getReleaseById(id: string): Promise<Release | undefined> {
  const releases = await getMergedReleases()
  return releases.find((r) => r.id === id)
}

/**
 * Get a single release by slug
 */
export async function getReleaseBySlug(slug: string): Promise<Release | undefined> {
  const releases = await getMergedReleases()
  return releases.find((r) => r.slug === slug)
}

/**
 * Get all release slugs (for static generation)
 */
export function getAllReleaseSlugs(): string[] {
  return releasesData.releases.map((r) => r.slug)
}

/**
 * Get static release by slug (without user overrides, for static generation)
 */
export function getStaticReleaseBySlug(slug: string): Release | undefined {
  const yaml = releasesData.releases.find((r) => r.slug === slug)
  return yaml ? yamlToRelease(yaml) : undefined
}

/**
 * Get static config (without async, for static generation)
 */
export function getStaticConfig() {
  return releasesData.config
}

/**
 * Search releases by query
 */
export async function searchReleases(query: string): Promise<Release[]> {
  if (!query.trim()) {
    return getMergedReleases()
  }

  const releases = await getMergedReleases()
  const lowerQuery = query.toLowerCase()

  return releases.filter((r) => {
    return (
      r.title.toLowerCase().includes(lowerQuery) ||
      r.series.toLowerCase().includes(lowerQuery) ||
      r.publisher.toLowerCase().includes(lowerQuery) ||
      r.writers.some((w) => w.toLowerCase().includes(lowerQuery)) ||
      r.artists.some((a) => a.toLowerCase().includes(lowerQuery)) ||
      r.genres.some((g) => g.toLowerCase().includes(lowerQuery)) ||
      r.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
    )
  })
}
