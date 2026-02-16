import { naturalCollator } from "./sort-utils";
import type { Comic } from "./types";

interface ParsedComic {
  seriesName: string;
  issueNumber: number | null;
  year?: number;
  volume?: number;
}

/**
 * Parse a comic title to extract series name and issue number.
 * Handles common naming patterns:
 * - "Batman #1", "Batman #001"
 * - "Batman Issue 1"
 * - "Batman Vol. 1 #5", "Batman v1 #5"
 * - "Amazing Spider-Man 001"
 * - "X-Men (2021) #01"
 * - "Batman 2021 001"
 */
export function parseComicTitle(title: string): ParsedComic {
  let seriesName = title;
  let issueNumber: number | null = null;
  let year: number | undefined;
  let volume: number | undefined;

  // Remove file extensions if present
  seriesName = seriesName.replace(/\.(cbz|cbr|pdf|zip|rar)$/i, "");

  // Extract year in parentheses: "X-Men (2021) #01"
  const yearMatch = seriesName.match(/\((\d{4})\)/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    seriesName = seriesName.replace(yearMatch[0], "").trim();
  }

  // Extract volume: "Vol. 1", "Vol 1", "v1", "Volume 1"
  const volumeMatch = seriesName.match(/\b(?:vol(?:ume)?\.?\s*|v)(\d+)\b/i);
  if (volumeMatch) {
    volume = parseInt(volumeMatch[1], 10);
    seriesName = seriesName.replace(volumeMatch[0], "").trim();
  }

  // Extract issue number with # symbol: "#1", "#001", "# 1"
  const hashMatch = seriesName.match(/#\s*(\d+)/);
  if (hashMatch) {
    issueNumber = parseInt(hashMatch[1], 10);
    seriesName = seriesName.replace(hashMatch[0], "").trim();
  }

  // Extract issue number with "Issue": "Issue 1", "Issue #1"
  if (issueNumber === null) {
    const issueMatch = seriesName.match(/\bissue\s*#?\s*(\d+)\b/i);
    if (issueMatch) {
      issueNumber = parseInt(issueMatch[1], 10);
      seriesName = seriesName.replace(issueMatch[0], "").trim();
    }
  }

  // Extract trailing number: "Batman 001", "Spider-Man 12"
  if (issueNumber === null) {
    const trailingMatch = seriesName.match(/\s+(\d{1,4})$/);
    if (trailingMatch) {
      const num = parseInt(trailingMatch[1], 10);
      // Only treat as issue number if it's reasonable (1-9999)
      // and not likely a year
      if (num > 0 && num < 10000 && (num < 1900 || num > 2100)) {
        issueNumber = num;
        seriesName = seriesName.replace(trailingMatch[0], "").trim();
      }
    }
  }

  // Clean up series name
  seriesName = seriesName
    .replace(/[-_]+$/, "") // Remove trailing dashes/underscores
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  return {
    seriesName,
    issueNumber,
    year,
    volume,
  };
}

/**
 * Normalize a series name for comparison.
 * Makes matching more flexible by ignoring case, punctuation, and common variations.
 */
export function normalizeSeriesName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/[^\w\s']/g, "") // Remove punctuation except apostrophes
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/^the\s+/i, "") // Remove leading "the"
    .trim();
}

/**
 * Check if two comics are in the same series.
 */
export function isSameSeries(comic1: Comic, comic2: Comic): boolean {
  // If both have explicit series set, compare those
  if (comic1.series && comic2.series) {
    return (
      normalizeSeriesName(comic1.series) === normalizeSeriesName(comic2.series)
    );
  }

  // Otherwise, parse titles
  const parsed1 = parseComicTitle(comic1.title);
  const parsed2 = parseComicTitle(comic2.title);

  return (
    normalizeSeriesName(parsed1.seriesName) ===
    normalizeSeriesName(parsed2.seriesName)
  );
}

/**
 * Get the issue number for a comic, either from explicit field or parsed from title.
 */
export function getIssueNumber(comic: Comic): number | null {
  // If explicit issue field is set, parse it
  if (comic.issue) {
    const num = parseInt(comic.issue.replace(/\D/g, ""), 10);
    if (!Number.isNaN(num)) return num;
  }

  // Otherwise, parse from title
  const parsed = parseComicTitle(comic.title);
  return parsed.issueNumber;
}

/**
 * Get the series name for a comic, either from explicit field or parsed from title.
 */
export function getSeriesName(comic: Comic): string {
  if (comic.series) return comic.series;

  const parsed = parseComicTitle(comic.title);
  return parsed.seriesName;
}

/**
 * Get the year for a comic, either from releaseDate field or parsed from title.
 */
export function getYear(comic: Comic): number | null {
  if (comic.releaseDate) {
    const year = new Date(comic.releaseDate).getFullYear();
    if (!Number.isNaN(year)) return year;
  }
  const parsed = parseComicTitle(comic.title);
  return parsed.year ?? null;
}

/**
 * Find the next issue in the series for a given comic.
 * Returns null if no next issue is found.
 */
export function findNextIssue(
  currentComic: Comic,
  allComics: Comic[],
): Comic | null {
  const currentIssue = getIssueNumber(currentComic);

  // Can't find next if current doesn't have an issue number
  if (currentIssue === null) return null;

  const currentSeries = normalizeSeriesName(getSeriesName(currentComic));

  // Find all comics in the same series with issue numbers
  const seriesComics = allComics
    .filter((comic) => {
      if (comic.id === currentComic.id) return false;
      const series = normalizeSeriesName(getSeriesName(comic));
      return series === currentSeries;
    })
    .map((comic) => ({
      comic,
      issue: getIssueNumber(comic),
    }))
    .filter(
      (item): item is { comic: Comic; issue: number } => item.issue !== null,
    );

  // Sort by issue number
  seriesComics.sort((a, b) => a.issue - b.issue);

  // Find the next issue (first one with a higher issue number)
  const nextIssue = seriesComics.find((item) => item.issue > currentIssue);

  return nextIssue?.comic ?? null;
}

/**
 * Find the next comic by alphabetical name sort order.
 * This is a fallback when series-based matching doesn't find a result.
 * Returns null if this is the last comic alphabetically.
 */
export function findNextComicByName(
  currentComic: Comic,
  allComics: Comic[],
): Comic | null {
  // Sort all comics alphabetically by title using natural number sort
  const sortedComics = [...allComics].sort((a, b) =>
    naturalCollator.compare(a.title, b.title),
  );

  // Find current comic's position
  const currentIndex = sortedComics.findIndex((c) => c.id === currentComic.id);
  if (currentIndex === -1) return null;

  // Return next comic if it exists
  if (currentIndex < sortedComics.length - 1) {
    return sortedComics[currentIndex + 1];
  }

  return null;
}

/**
 * Find the next comic to read after the current one.
 * First tries to find the next issue in the same series.
 * Falls back to the next comic alphabetically if no series match is found.
 */
export function findNextComic(
  currentComic: Comic,
  allComics: Comic[],
): Comic | null {
  // First, try to find the next issue in the series
  const nextInSeries = findNextIssue(currentComic, allComics);
  if (nextInSeries) return nextInSeries;

  // Fall back to alphabetical order
  return findNextComicByName(currentComic, allComics);
}

/**
 * Find the previous issue in the series for a given comic.
 * Returns null if no previous issue is found.
 */
export function findPreviousIssue(
  currentComic: Comic,
  allComics: Comic[],
): Comic | null {
  const currentIssue = getIssueNumber(currentComic);

  if (currentIssue === null) return null;

  const currentSeries = normalizeSeriesName(getSeriesName(currentComic));

  const seriesComics = allComics
    .filter((comic) => {
      if (comic.id === currentComic.id) return false;
      const series = normalizeSeriesName(getSeriesName(comic));
      return series === currentSeries;
    })
    .map((comic) => ({
      comic,
      issue: getIssueNumber(comic),
    }))
    .filter(
      (item): item is { comic: Comic; issue: number } => item.issue !== null,
    );

  // Sort by issue number descending
  seriesComics.sort((a, b) => b.issue - a.issue);

  // Find the previous issue (first one with a lower issue number)
  const prevIssue = seriesComics.find((item) => item.issue < currentIssue);

  return prevIssue?.comic ?? null;
}
