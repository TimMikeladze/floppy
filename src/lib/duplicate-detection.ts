import { normalizeSeriesName, parseComicTitle } from "./series-utils";
import type { Comic } from "./types";

export interface DuplicateMatch {
  existingComic: Comic;
  confidence: number;
  matchType: "exact" | "filename" | "metadata" | "size";
}

/**
 * Normalize a filename for comparison by removing extensions,
 * underscores, and extra whitespace.
 */
function normalizeFilename(filename: string): string {
  return filename
    .replace(/\.(cbz|cbr|pdf|zip|rar)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity between two strings (0-1 scale).
 */
function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Check if a file might be a duplicate of an existing comic.
 */
export function findDuplicates(
  file: File,
  existingComics: Comic[],
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const normalizedNewFilename = normalizeFilename(file.name);
  const parsedNew = parseComicTitle(file.name);
  const normalizedNewSeries = normalizeSeriesName(parsedNew.seriesName);

  for (const comic of existingComics) {
    // Check exact filename match
    if (comic.fileName) {
      const normalizedExisting = normalizeFilename(comic.fileName);
      if (normalizedNewFilename === normalizedExisting) {
        matches.push({
          existingComic: comic,
          confidence: 1.0,
          matchType: "exact",
        });
        continue;
      }

      // Check filename similarity
      const filenameSimilarity = stringSimilarity(
        normalizedNewFilename,
        normalizedExisting,
      );
      if (filenameSimilarity > 0.85) {
        matches.push({
          existingComic: comic,
          confidence: filenameSimilarity,
          matchType: "filename",
        });
        continue;
      }
    }

    // Check series + issue match
    const parsedExisting = parseComicTitle(comic.title);
    const normalizedExistingSeries = normalizeSeriesName(
      comic.series || parsedExisting.seriesName,
    );
    const existingIssue = comic.issue
      ? parseInt(comic.issue.replace(/\D/g, ""), 10)
      : parsedExisting.issueNumber;

    if (
      normalizedNewSeries === normalizedExistingSeries &&
      parsedNew.issueNumber !== null &&
      existingIssue !== null &&
      parsedNew.issueNumber === existingIssue
    ) {
      matches.push({
        existingComic: comic,
        confidence: 0.9,
        matchType: "metadata",
      });
      continue;
    }

    // Check file size match (within 1% tolerance) + similar title
    if (
      comic.fileSize &&
      Math.abs(comic.fileSize - file.size) / file.size < 0.01
    ) {
      const titleSimilarity = stringSimilarity(
        normalizedNewFilename,
        normalizeFilename(comic.title),
      );
      if (titleSimilarity > 0.7) {
        matches.push({
          existingComic: comic,
          confidence: 0.7 + titleSimilarity * 0.2,
          matchType: "size",
        });
      }
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Group files by potential duplicates.
 */
export function groupDuplicates(
  files: File[],
  existingComics: Comic[],
): {
  unique: File[];
  duplicates: Array<{ file: File; matches: DuplicateMatch[] }>;
} {
  const unique: File[] = [];
  const duplicates: Array<{ file: File; matches: DuplicateMatch[] }> = [];

  for (const file of files) {
    const matches = findDuplicates(file, existingComics);
    if (matches.length > 0 && matches[0].confidence > 0.7) {
      duplicates.push({ file, matches });
    } else {
      unique.push(file);
    }
  }

  return { unique, duplicates };
}
