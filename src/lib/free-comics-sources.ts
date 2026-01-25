/**
 * Free Legal Comic Sources
 *
 * This is the single entry point for configuring where users can find free legal comics.
 * Add, remove, or modify sources here and they will be reflected throughout the app.
 */

export interface FreeComicSource {
  /** Display name of the source */
  name: string
  /** URL to the source */
  url: string
  /** Brief description of what's available */
  description: string
  /** Category of content */
  category: "public-domain" | "drm-free"
}

export const FREE_COMICS_SOURCES: FreeComicSource[] = [
  {
    name: "Humble Bundle",
    url: "https://www.humblebundle.com/books",
    description: "DRM-free downloads (PDF, CBZ, EPUB)",
    category: "drm-free",
  },
  {
    name: "Digital Comic Museum",
    url: "https://digitalcomicmuseum.com",
    description: "Downloadable public domain golden age comics (CBZ)",
    category: "public-domain",
  },
  {
    name: "Comic Book Plus",
    url: "https://comicbookplus.com",
    description: "Downloadable public domain comics (CBZ/CBR)",
    category: "public-domain",
  },
  {
    name: "Internet Archive Comics",
    url: "https://archive.org/details/comics",
    description: "Downloadable public domain comics (PDF, CBZ)",
    category: "public-domain",
  },
  {
    name: "DriveThruComics",
    url: "https://www.drivethrucomics.com/browse.php?filters=0_0_0_0_0&free=1",
    description: "Free DRM-free downloads (PDF)",
    category: "drm-free",
  },
  {
    name: "Standard Ebooks Comics",
    url: "https://standardebooks.org/subjects/comics",
    description: "High-quality public domain comics (EPUB)",
    category: "public-domain",
  },
  {
    name: "Project Gutenberg Comics",
    url: "https://www.gutenberg.org/ebooks/subject/188",
    description: "Public domain graphic novels (EPUB, PDF)",
    category: "public-domain",
  },
]

/**
 * Get sources filtered by category
 */
export function getSourcesByCategory(category: FreeComicSource["category"]): FreeComicSource[] {
  return FREE_COMICS_SOURCES.filter((source) => source.category === category)
}

/**
 * Get all unique categories
 */
export function getCategories(): FreeComicSource["category"][] {
  return [...new Set(FREE_COMICS_SOURCES.map((source) => source.category))]
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<FreeComicSource["category"], string> = {
  "public-domain": "Public Domain",
  "drm-free": "DRM-Free",
}
