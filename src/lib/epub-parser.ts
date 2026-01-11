import JSZip from "jszip"
import type { ComicFormat } from "./types"

export interface EpubParseResult {
  pages: Blob[]
  metadata: {
    title: string
    totalPages: number
    fileName: string
    fileSize: number
    format: ComicFormat
    author?: string
    publisher?: string
  }
}

export interface EpubParseOptions {
  /** Progress callback - receives current page and total pages */
  onProgress?: (current: number, total: number) => void
  /** Abort signal for cancellation support */
  signal?: AbortSignal
  /** Page width for rendering (default: 800) */
  pageWidth?: number
  /** Page height for rendering (default: 1200) */
  pageHeight?: number
}

interface EpubMetadata {
  title: string
  author?: string
  publisher?: string
  language?: string
}

interface SpineItem {
  id: string
  href: string
  mediaType?: string
}

/**
 * Parse an EPUB file and render content as images
 */
export async function parseEpubFile(
  file: File,
  options: EpubParseOptions = {}
): Promise<EpubParseResult> {
  const {
    onProgress,
    signal,
    pageWidth = 800,
    pageHeight = 1200,
  } = options

  if (signal?.aborted) {
    throw new DOMException("EPUB parsing was cancelled", "AbortError")
  }

  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  if (signal?.aborted) {
    throw new DOMException("EPUB parsing was cancelled", "AbortError")
  }

  // Parse container.xml to find the OPF file
  const containerXml = await contents.file("META-INF/container.xml")?.async("text")
  if (!containerXml) {
    throw new EpubParseError("Invalid EPUB: Missing container.xml")
  }

  const opfPath = parseContainerXml(containerXml)
  if (!opfPath) {
    throw new EpubParseError("Invalid EPUB: Could not find OPF file path")
  }

  // Get the base directory of the OPF file
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf("/") + 1)

  // Parse the OPF file
  const opfContent = await contents.file(opfPath)?.async("text")
  if (!opfContent) {
    throw new EpubParseError(`Invalid EPUB: Could not read OPF file at ${opfPath}`)
  }

  const { metadata, spine, manifest } = parseOpf(opfContent)

  if (signal?.aborted) {
    throw new DOMException("EPUB parsing was cancelled", "AbortError")
  }

  // Process spine items to get content
  const pages: Blob[] = []
  const totalItems = spine.length

  onProgress?.(0, totalItems)

  for (let i = 0; i < spine.length; i++) {
    if (signal?.aborted) {
      throw new DOMException("EPUB parsing was cancelled", "AbortError")
    }

    const spineItem = spine[i]
    const manifestItem = manifest.get(spineItem.id)

    if (!manifestItem) {
      console.warn(`[epub-parser] Spine item ${spineItem.id} not found in manifest`)
      continue
    }

    const contentPath = opfDir + manifestItem.href
    const content = await contents.file(contentPath)?.async("text")

    if (!content) {
      console.warn(`[epub-parser] Could not read content at ${contentPath}`)
      continue
    }

    // Render the HTML content to image blobs
    const chapterPages = await renderHtmlToPages(
      content,
      contents,
      opfDir,
      pageWidth,
      pageHeight,
      signal
    )

    pages.push(...chapterPages)
    onProgress?.(i + 1, totalItems)
  }

  // If no pages were generated, create a placeholder
  if (pages.length === 0) {
    const placeholder = await createPlaceholderPage(
      "No readable content found in EPUB",
      pageWidth,
      pageHeight
    )
    pages.push(placeholder)
  }

  return {
    pages,
    metadata: {
      title: metadata.title || extractTitleFromFilename(file.name),
      totalPages: pages.length,
      fileName: file.name,
      fileSize: file.size,
      format: "epub",
      author: metadata.author,
      publisher: metadata.publisher,
    },
  }
}

/**
 * Parse container.xml to find the OPF file path
 */
function parseContainerXml(xml: string): string | null {
  // Look for rootfile element with full-path attribute
  const rootfileMatch = xml.match(/rootfile[^>]+full-path=["']([^"']+)["']/i)
  return rootfileMatch?.[1] || null
}

/**
 * Parse OPF file to extract metadata, manifest, and spine
 */
function parseOpf(opfContent: string): {
  metadata: EpubMetadata
  spine: SpineItem[]
  manifest: Map<string, { href: string; mediaType: string }>
} {
  const metadata: EpubMetadata = {
    title: "",
  }

  // Extract metadata
  const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)
  metadata.title = titleMatch?.[1]?.trim() || ""

  const authorMatch = opfContent.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i)
  metadata.author = authorMatch?.[1]?.trim()

  const publisherMatch = opfContent.match(/<dc:publisher[^>]*>([^<]+)<\/dc:publisher>/i)
  metadata.publisher = publisherMatch?.[1]?.trim()

  // Parse manifest
  const manifest = new Map<string, { href: string; mediaType: string }>()
  const manifestSection = opfContent.match(/<manifest[^>]*>([\s\S]*?)<\/manifest>/i)

  if (manifestSection) {
    const itemRegex = /<item[^>]+id=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*(?:media-type=["']([^"']+)["'])?[^>]*\/?>/gi
    let match
    while ((match = itemRegex.exec(manifestSection[1])) !== null) {
      manifest.set(match[1], {
        href: decodeURIComponent(match[2]),
        mediaType: match[3] || "application/xhtml+xml",
      })
    }

    // Also try alternate attribute order
    const itemRegex2 = /<item[^>]+href=["']([^"']+)["'][^>]+id=["']([^"']+)["'][^>]*(?:media-type=["']([^"']+)["'])?[^>]*\/?>/gi
    while ((match = itemRegex2.exec(manifestSection[1])) !== null) {
      if (!manifest.has(match[2])) {
        manifest.set(match[2], {
          href: decodeURIComponent(match[1]),
          mediaType: match[3] || "application/xhtml+xml",
        })
      }
    }
  }

  // Parse spine
  const spine: SpineItem[] = []
  const spineSection = opfContent.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i)

  if (spineSection) {
    const itemRefRegex = /<itemref[^>]+idref=["']([^"']+)["'][^>]*\/?>/gi
    let match
    while ((match = itemRefRegex.exec(spineSection[1])) !== null) {
      spine.push({ id: match[1], href: "" })
    }
  }

  return { metadata, spine, manifest }
}

/**
 * Render HTML content to canvas pages
 */
async function renderHtmlToPages(
  html: string,
  zip: JSZip,
  opfDir: string,
  pageWidth: number,
  pageHeight: number,
  signal?: AbortSignal
): Promise<Blob[]> {
  // Extract text content from HTML
  const textContent = extractTextFromHtml(html)

  if (!textContent.trim()) {
    return []
  }

  // Also try to extract images from the HTML
  const images = await extractImagesFromHtml(html, zip, opfDir)

  // If we have full-page images, return them directly
  if (images.length > 0 && textContent.length < 100) {
    return images
  }

  // Render text to canvas pages
  const pages: Blob[] = []

  // Add any extracted images first
  pages.push(...images)

  // Render text content
  const textPages = await renderTextToPages(textContent, pageWidth, pageHeight)
  pages.push(...textPages)

  return pages
}

/**
 * Extract plain text from HTML content
 */
function extractTextFromHtml(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  // Convert common HTML elements to text markers
  text = text.replace(/<h[1-6][^>]*>/gi, "\n\n### ")
  text = text.replace(/<\/h[1-6]>/gi, "\n\n")
  text = text.replace(/<p[^>]*>/gi, "\n")
  text = text.replace(/<\/p>/gi, "\n")
  text = text.replace(/<br[^>]*\/?>/gi, "\n")
  text = text.replace(/<li[^>]*>/gi, "\n• ")
  text = text.replace(/<\/li>/gi, "")
  text = text.replace(/<div[^>]*>/gi, "\n")
  text = text.replace(/<\/div>/gi, "\n")

  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, "")

  // Decode HTML entities
  text = decodeHtmlEntities(text)

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n")
  text = text.trim()

  return text
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  }

  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.split(entity).join(char)
  }

  // Handle numeric entities
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

  return result
}

/**
 * Extract images from HTML content
 */
async function extractImagesFromHtml(
  html: string,
  zip: JSZip,
  opfDir: string
): Promise<Blob[]> {
  const images: Blob[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    let imagePath = src

    // Handle relative paths
    if (!src.startsWith("/") && !src.startsWith("http")) {
      imagePath = opfDir + src
    }

    // Normalize path (handle ../ etc)
    imagePath = normalizePath(imagePath)

    try {
      const imageBlob = await zip.file(imagePath)?.async("blob")
      if (imageBlob && imageBlob.size > 1000) { // Only include reasonably sized images
        images.push(imageBlob)
      }
    } catch (e) {
      console.warn(`[epub-parser] Could not extract image: ${imagePath}`)
    }
  }

  // Also check for SVG images
  const svgRegex = /<image[^>]+href=["']([^"']+)["'][^>]*>/gi
  while ((match = svgRegex.exec(html)) !== null) {
    const href = match[1]
    let imagePath = href

    if (!href.startsWith("/") && !href.startsWith("http")) {
      imagePath = opfDir + href
    }

    imagePath = normalizePath(imagePath)

    try {
      const imageBlob = await zip.file(imagePath)?.async("blob")
      if (imageBlob && imageBlob.size > 1000) {
        images.push(imageBlob)
      }
    } catch (e) {
      console.warn(`[epub-parser] Could not extract SVG image: ${imagePath}`)
    }
  }

  return images
}

/**
 * Normalize a file path (resolve .. and . components)
 */
function normalizePath(path: string): string {
  const parts = path.split("/")
  const result: string[] = []

  for (const part of parts) {
    if (part === "..") {
      result.pop()
    } else if (part !== "." && part !== "") {
      result.push(part)
    }
  }

  return result.join("/")
}

/**
 * Render text content to canvas pages
 */
async function renderTextToPages(
  text: string,
  pageWidth: number,
  pageHeight: number
): Promise<Blob[]> {
  const pages: Blob[] = []
  const padding = 40
  const lineHeight = 28
  const fontSize = 18
  const maxWidth = pageWidth - padding * 2
  const maxHeight = pageHeight - padding * 2
  const linesPerPage = Math.floor(maxHeight / lineHeight)

  // Split text into lines that fit within page width
  const lines = wrapText(text, maxWidth, fontSize)

  // Group lines into pages
  for (let i = 0; i < lines.length; i += linesPerPage) {
    const pageLines = lines.slice(i, i + linesPerPage)
    const pageBlob = await renderPageToBlob(pageLines, pageWidth, pageHeight, padding, lineHeight, fontSize)
    pages.push(pageBlob)
  }

  return pages
}

/**
 * Wrap text to fit within a maximum width
 */
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split("\n")

  // Approximate character width (will vary by font)
  const charWidth = fontSize * 0.5
  const charsPerLine = Math.floor(maxWidth / charWidth)

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === "") {
      lines.push("")
      continue
    }

    // Check if this is a heading
    const isHeading = paragraph.startsWith("### ")
    const content = isHeading ? paragraph.slice(4) : paragraph

    const words = content.split(/\s+/)
    let currentLine = isHeading ? "### " : ""

    for (const word of words) {
      const testLine = currentLine + (currentLine.endsWith("### ") || currentLine === "" ? "" : " ") + word

      if (testLine.length > charsPerLine && currentLine !== "" && !currentLine.endsWith("### ")) {
        lines.push(currentLine.trim())
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }
  }

  return lines
}

/**
 * Render a single page to a blob
 */
async function renderPageToBlob(
  lines: string[],
  pageWidth: number,
  pageHeight: number,
  padding: number,
  lineHeight: number,
  fontSize: number
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = pageWidth
  canvas.height = pageHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get canvas context")
  }

  // White background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, pageWidth, pageHeight)

  // Set text properties
  ctx.fillStyle = "#1a1a1a"
  ctx.textBaseline = "top"

  let y = padding

  for (const line of lines) {
    const isHeading = line.startsWith("### ")
    const text = isHeading ? line.slice(4) : line

    if (isHeading) {
      ctx.font = `bold ${fontSize + 6}px Georgia, 'Times New Roman', serif`
      y += lineHeight * 0.5 // Extra space before heading
    } else {
      ctx.font = `${fontSize}px Georgia, 'Times New Roman', serif`
    }

    ctx.fillText(text, padding, y)
    y += lineHeight

    if (isHeading) {
      y += lineHeight * 0.3 // Extra space after heading
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create blob from canvas"))
        }
      },
      "image/png",
      1
    )
  })
}

/**
 * Create a placeholder page with a message
 */
async function createPlaceholderPage(
  message: string,
  pageWidth: number,
  pageHeight: number
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = pageWidth
  canvas.height = pageHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Failed to get canvas context")
  }

  // Light gray background
  ctx.fillStyle = "#f5f5f5"
  ctx.fillRect(0, 0, pageWidth, pageHeight)

  // Message text
  ctx.fillStyle = "#666666"
  ctx.font = "18px system-ui, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(message, pageWidth / 2, pageHeight / 2)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create blob from canvas"))
        }
      },
      "image/png",
      1
    )
  })
}

/**
 * Extract a clean title from filename
 */
function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.epub$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Custom error for EPUB parsing errors
 */
export class EpubParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EpubParseError"
  }
}

/**
 * Check if a file is a valid EPUB by examining its structure
 */
export async function isEpubFile(file: File): Promise<boolean> {
  try {
    const zip = new JSZip()
    const contents = await zip.loadAsync(file.slice(0, 65536)) // Read first 64KB

    // Check for mimetype file (should be first in EPUB)
    const mimetype = await contents.file("mimetype")?.async("text")
    if (mimetype?.trim() === "application/epub+zip") {
      return true
    }

    // Check for container.xml as fallback
    const hasContainer = !!contents.file("META-INF/container.xml")
    return hasContainer
  } catch {
    return false
  }
}
