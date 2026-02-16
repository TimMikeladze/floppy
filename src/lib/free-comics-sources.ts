/**
 * Free Legal Comic Sources
 *
 * This is the single entry point for configuring where users can find free legal comics.
 * Add, remove, or modify sources here and they will be reflected throughout the app.
 */

export interface FreeComicSource {
  /** Display name of the source */
  name: string;
  /** URL to the source */
  url: string;
  /** Brief description of what's available */
  description: string;
  /** Category of content */
  category: "public-domain" | "drm-free";
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
    name: "Itch.io Comics",
    url: "https://itch.io/comics/free",
    description: "Free indie comics from creators (PDF, CBZ)",
    category: "drm-free",
  },
  {
    name: "Panel Syndicate",
    url: "https://panelsyndicate.com",
    description: "Pay-what-you-want DRM-free comics (PDF)",
    category: "drm-free",
  },
  {
    name: "Gumroad Comics",
    url: "https://gumroad.com/discover?query=comics%20free",
    description: "Creator-direct DRM-free comics (PDF, CBZ)",
    category: "drm-free",
  },
  {
    name: "StoryBundle",
    url: "https://storybundle.com/comics",
    description: "DRM-free comic bundles (PDF, EPUB, CBZ)",
    category: "drm-free",
  },
  {
    name: "Smashwords Comics",
    url: "https://www.smashwords.com/shelves/category/13/newest/0/free/any",
    description: "Free DRM-free graphic novels (EPUB, PDF)",
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
  {
    name: "Ko-fi Comics",
    url: "https://ko-fi.com/explore?query=comic&type=Shop",
    description: "Creator-direct free comics (PDF, CBZ)",
    category: "drm-free",
  },
  {
    name: "Open Library Comics",
    url: "https://openlibrary.org/subjects/comics",
    description: "Borrowable comics with free account (PDF, EPUB)",
    category: "drm-free",
  },
  {
    name: "HathiTrust Comics",
    url: "https://www.hathitrust.org/search?q=comics&facet=genre:Comics",
    description: "Academic library public domain comics (PDF)",
    category: "public-domain",
  },
  {
    name: "Gallica Comics",
    url: "https://gallica.bnf.fr/html/und/bandes-dessinees/bandes-dessinees",
    description: "French national library comics (PDF)",
    category: "public-domain",
  },
  {
    name: "DPLA Comics",
    url: "https://dp.la/search?type=%22image%22&q=comics",
    description: "Digital Public Library of America (PDF)",
    category: "public-domain",
  },
  {
    name: "Lulu Free Comics",
    url: "https://www.lulu.com/shop/search.ep?type=Print&keyWords=comics&sitesearch=lulu.com&q=&availabilityCode=AVAILABLE_FREE",
    description: "Self-published free comics (PDF)",
    category: "drm-free",
  },
];

/**
 * Get sources filtered by category
 */
export function getSourcesByCategory(
  category: FreeComicSource["category"],
): FreeComicSource[] {
  return FREE_COMICS_SOURCES.filter((source) => source.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): FreeComicSource["category"][] {
  return [...new Set(FREE_COMICS_SOURCES.map((source) => source.category))];
}

/**
 * Category display names
 */
export const CATEGORY_LABELS: Record<FreeComicSource["category"], string> = {
  "public-domain": "Public Domain",
  "drm-free": "DRM-Free",
};
