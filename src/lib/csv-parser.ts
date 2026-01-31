/**
 * CSV parser for comic data sources.
 * Expects flat CSV with one row per page.
 */

import type { Comic, ComicSource, RemotePages, RemotePage } from "./types"

export interface CsvRow {
  series_title: string
  issue_number: string
  page_number: string
  image_url: string
  // Optional fields
  series_slug?: string
  issue_title?: string
  cover_url?: string
  publisher?: string
  release_date?: string
  author?: string
  tags?: string
}

export interface ParsedIssue {
  seriesTitle: string
  seriesSlug: string
  issueNumber: string
  issueTitle: string
  coverUrl: string
  publisher?: string
  releaseDate?: string
  author?: string
  tags: string[]
  pages: RemotePage[]
}

export interface ParseResult {
  issues: ParsedIssue[]
  errors: string[]
}

/**
 * Parse CSV text into rows.
 * Handles quoted fields and commas within quotes.
 */
function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim())
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'))
  const rows = lines.slice(1).map(parseRow)

  return { headers, rows }
}

/**
 * Generate a slug from a title.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Parse a CSV file and group by issue.
 */
export function parseCsvDataSource(csvText: string): ParseResult {
  const { headers, rows } = parseCsvText(csvText)
  const errors: string[] = []

  // Validate required headers
  const requiredHeaders = ['series_title', 'issue_number', 'page_number', 'image_url']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`)
    return { issues: [], errors }
  }

  // Get column indices
  const colIndex = (name: string) => headers.indexOf(name)

  // Group rows by series + issue
  const issueMap = new Map<string, ParsedIssue>()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2 // +2 for 1-based and header row

    const seriesTitle = row[colIndex('series_title')]?.trim()
    const issueNumber = row[colIndex('issue_number')]?.trim()
    const pageNumberStr = row[colIndex('page_number')]?.trim()
    const imageUrl = row[colIndex('image_url')]?.trim()

    // Validate required fields
    if (!seriesTitle || !issueNumber || !pageNumberStr || !imageUrl) {
      errors.push(`Line ${lineNum}: Missing required field`)
      continue
    }

    const pageNumber = parseInt(pageNumberStr, 10)
    if (isNaN(pageNumber) || pageNumber < 1) {
      errors.push(`Line ${lineNum}: Invalid page number "${pageNumberStr}"`)
      continue
    }

    // Create issue key
    const issueKey = `${seriesTitle}::${issueNumber}`

    // Get or create issue
    let issue = issueMap.get(issueKey)
    if (!issue) {
      const seriesSlug = row[colIndex('series_slug')]?.trim() || slugify(seriesTitle)
      const issueTitle = row[colIndex('issue_title')]?.trim() || `${seriesTitle} #${issueNumber}`
      const coverUrl = row[colIndex('cover_url')]?.trim() || ''
      const publisher = row[colIndex('publisher')]?.trim()
      const releaseDate = row[colIndex('release_date')]?.trim()
      const author = row[colIndex('author')]?.trim()
      const tagsStr = row[colIndex('tags')]?.trim() || ''
      const tags = tagsStr ? tagsStr.split('|').map(t => t.trim()).filter(Boolean) : []

      issue = {
        seriesTitle,
        seriesSlug,
        issueNumber,
        issueTitle,
        coverUrl,
        publisher,
        releaseDate,
        author,
        tags,
        pages: [],
      }
      issueMap.set(issueKey, issue)
    }

    // Add page
    issue.pages.push({
      pageNumber,
      imageUrl,
    })
  }

  // Sort pages within each issue
  const issues = Array.from(issueMap.values())
  for (const issue of issues) {
    issue.pages.sort((a, b) => a.pageNumber - b.pageNumber)

    // If no explicit cover URL, use first page
    if (!issue.coverUrl && issue.pages.length > 0) {
      issue.coverUrl = issue.pages[0].imageUrl
    }
  }

  // Sort issues by series then issue number
  issues.sort((a, b) => {
    const seriesCompare = a.seriesTitle.localeCompare(b.seriesTitle)
    if (seriesCompare !== 0) return seriesCompare
    return parseInt(a.issueNumber, 10) - parseInt(b.issueNumber, 10)
  })

  return { issues, errors }
}

/**
 * Convert parsed issues to Comic and RemotePages records for storage.
 */
export function convertToStorageFormat(
  issues: ParsedIssue[],
  sourceId: string
): { comics: Comic[]; remotePages: RemotePages[] } {
  const comics: Comic[] = []
  const remotePages: RemotePages[] = []

  for (const issue of issues) {
    const comicId = crypto.randomUUID()

    const comic: Comic = {
      id: comicId,
      title: issue.issueTitle,
      coverImage: '', // Will be loaded on demand
      totalPages: issue.pages.length,
      currentPage: 0,
      series: issue.seriesTitle,
      issue: issue.issueNumber,
      hasFile: false,
      sourceType: 'remote',
      sourceId,
      coverUrl: issue.coverUrl,
      publisher: issue.publisher,
      releaseDate: issue.releaseDate,
      author: issue.author,
      addedAt: new Date(),
    }

    comics.push(comic)

    remotePages.push({
      comicId,
      pages: issue.pages,
    })
  }

  return { comics, remotePages }
}
