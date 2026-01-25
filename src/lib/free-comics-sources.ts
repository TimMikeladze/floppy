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
  category: "public-domain" | "free-legal" | "drm-free" | "webcomics"
}

export const FREE_COMICS_SOURCES: FreeComicSource[] = [
  {
    name: "Humble Bundle",
    url: "https://www.humblebundle.com/books",
    description: "Pay-what-you-want bundles, often includes free content",
    category: "drm-free",
  },
  {
    name: "Digital Comic Museum",
    url: "https://digitalcomicmuseum.com",
    description: "Free public domain golden age comics",
    category: "public-domain",
  },
  {
    name: "Comic Book Plus",
    url: "https://comicbookplus.com",
    description: "Public domain comics from the golden age",
    category: "public-domain",
  },
  {
    name: "Internet Archive Comics",
    url: "https://archive.org/details/comics",
    description: "Massive collection of scanned public domain comics",
    category: "public-domain",
  },
  {
    name: "Webtoon",
    url: "https://www.webtoons.com",
    description: "Free webcomics and manhwa",
    category: "webcomics",
  },
  {
    name: "Tapas",
    url: "https://tapas.io",
    description: "Free webcomics and graphic novels",
    category: "webcomics",
  },
  {
    name: "GlobalComix",
    url: "https://globalcomix.com",
    description: "Free indie comics from creators worldwide",
    category: "free-legal",
  },
  {
    name: "DriveThruComics",
    url: "https://www.drivethrucomics.com/browse.php?filters=0_0_0_0_0&free=1",
    description: "Free DRM-free digital comics",
    category: "drm-free",
  },
  {
    name: "Top Shelf Free",
    url: "https://www.topshelfcomix.com/catalog/free",
    description: "Free titles from Top Shelf Productions",
    category: "free-legal",
  },
  {
    name: "Marvel Free Comics",
    url: "https://www.marvel.com/comics/list/702/free_comics",
    description: "Official free comics from Marvel",
    category: "free-legal",
  },
  {
    name: "DC Free Comics",
    url: "https://www.dc.com/reader",
    description: "Free first issues and previews from DC",
    category: "free-legal",
  },
  {
    name: "Dark Horse Free",
    url: "https://www.darkhorse.com/Books/Browse/Free",
    description: "Free comics from Dark Horse",
    category: "free-legal",
  },
  {
    name: "Image Comics",
    url: "https://imagecomics.com/read/free-first-issues",
    description: "Free first issues from Image Comics",
    category: "free-legal",
  },
  {
    name: "Manga Plus",
    url: "https://mangaplus.shueisha.co.jp",
    description: "Official free manga from Shueisha (One Piece, Naruto, etc.)",
    category: "webcomics",
  },
  {
    name: "VIZ Free",
    url: "https://www.viz.com/read/free",
    description: "Free manga chapters from VIZ Media",
    category: "webcomics",
  },
  {
    name: "Hoopla",
    url: "https://www.hoopladigital.com/collection/comics",
    description: "Free comics with library card",
    category: "free-legal",
  },
  {
    name: "Libby",
    url: "https://www.overdrive.com/apps/libby",
    description: "Borrow comics free from your library",
    category: "free-legal",
  },
  {
    name: "ComicFury",
    url: "https://comicfury.com",
    description: "Free webcomic hosting community",
    category: "webcomics",
  },
  {
    name: "The Duck Webcomics",
    url: "https://www.theduckwebcomics.com",
    description: "Community of free webcomics",
    category: "webcomics",
  },
  {
    name: "Smackjeeves",
    url: "https://www.smackjeeves.com",
    description: "Webcomic hosting platform",
    category: "webcomics",
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
  "free-legal": "Free & Legal",
  "drm-free": "DRM-Free",
  "webcomics": "Webcomics",
}
