import type { ComicFormat } from "./types"

// Lazy-load pdfjs to reduce initial bundle size
let pdfjsLib: typeof import("pdfjs-dist") | null = null

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
    // Use HTTPS protocol explicitly to avoid issues with protocol-relative URLs
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  }
  return pdfjsLib
}

export interface PdfParseResult {
  pages: Blob[]
  metadata: {
    title: string
    totalPages: number
    fileName: string
    fileSize: number
    format: ComicFormat
  }
}

export interface PdfParseOptions {
  /** Scale factor for rendering (default: 2 for 2x resolution) */
  scale?: number
  /** Image format for output (default: "image/png") */
  imageFormat?: "image/png" | "image/jpeg" | "image/webp"
  /** Image quality for lossy formats like JPEG (0-1, default: 0.92) */
  imageQuality?: number
  /** Password for protected PDFs */
  password?: string
  /** Progress callback - receives current page and total pages */
  onProgress?: (current: number, total: number) => void
  /** Maximum number of pages to render in parallel (default: 1 for memory safety) */
  concurrency?: number
  /** Abort signal for cancellation support */
  signal?: AbortSignal
}

/**
 * Parse a PDF file and render all pages as images
 *
 * Features:
 * - Progress reporting via callback
 * - Password-protected PDF support
 * - Configurable image format and quality
 * - Cancellation support via AbortSignal
 * - Memory-efficient sequential processing with cleanup
 */
export async function parsePdfFile(
  file: File,
  options: PdfParseOptions = {}
): Promise<PdfParseResult> {
  const {
    scale = 2,
    imageFormat = "image/png",
    imageQuality = 0.92,
    password,
    onProgress,
    signal,
  } = options

  // Check for cancellation
  if (signal?.aborted) {
    throw new DOMException("PDF parsing was cancelled", "AbortError")
  }

  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  // Check for cancellation after loading file
  if (signal?.aborted) {
    throw new DOMException("PDF parsing was cancelled", "AbortError")
  }

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    password,
  })

  // Handle password-protected PDFs
  loadingTask.onPassword = (updateCallback: (password: string) => void, reason: number) => {
    if (reason === 1) {
      // First request for password
      if (password) {
        updateCallback(password)
      } else {
        throw new PdfPasswordError("PDF requires a password to open")
      }
    } else {
      // Incorrect password
      throw new PdfPasswordError("Incorrect password for PDF")
    }
  }

  let pdf: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>
  try {
    pdf = await loadingTask.promise
  } catch (error) {
    if (error instanceof PdfPasswordError) {
      throw error
    }
    if (error instanceof Error && error.message.includes("password")) {
      throw new PdfPasswordError("PDF requires a password to open")
    }
    throw new PdfParseError(`Failed to load PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  const pages: Blob[] = []
  const totalPages = pdf.numPages

  // Report initial progress
  onProgress?.(0, totalPages)

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    // Check for cancellation before each page
    if (signal?.aborted) {
      // Cleanup already rendered pages
      pdf.destroy()
      throw new DOMException("PDF parsing was cancelled", "AbortError")
    }

    try {
      const blob = await renderPage(pdf, pageNum, scale, imageFormat, imageQuality)
      pages.push(blob)
      onProgress?.(pageNum, totalPages)
    } catch (error) {
      console.error(`[pdf-parser] Error rendering page ${pageNum}:`, error)
      // Create a placeholder for failed pages instead of stopping
      const placeholderBlob = await createErrorPageBlob(pageNum, error)
      pages.push(placeholderBlob)
      onProgress?.(pageNum, totalPages)
    }
  }

  // Cleanup PDF document
  pdf.destroy()

  const title = extractTitleFromFilename(file.name)

  return {
    pages,
    metadata: {
      title,
      totalPages,
      fileName: file.name,
      fileSize: file.size,
      format: "pdf",
    },
  }
}

/**
 * Render a single PDF page to an image blob
 */
async function renderPage(
  pdf: Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>,
  pageNum: number,
  scale: number,
  imageFormat: string,
  imageQuality: number
): Promise<Blob> {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })

  // Create canvas for rendering
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext("2d", { alpha: false })

  if (!ctx) {
    page.cleanup()
    throw new Error(`Failed to get canvas context for page ${pageNum}`)
  }

  // Fill with white background (important for PDFs with transparency)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  try {
    // pdfjs-dist v5+ requires canvas: null when using canvasContext
    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: null,
    }).promise
  } finally {
    // Always cleanup page resources
    page.cleanup()
  }

  // Convert canvas to blob
  const blob = await canvasToBlob(canvas, imageFormat, imageQuality)

  // Clear canvas to help garbage collection
  canvas.width = 0
  canvas.height = 0

  return blob
}

/**
 * Convert canvas to blob with proper error handling
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  imageFormat: string,
  imageQuality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create blob from canvas"))
        }
      },
      imageFormat,
      imageQuality
    )
  })
}

/**
 * Create a placeholder image for pages that failed to render
 */
async function createErrorPageBlob(pageNum: number, error: unknown): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = 400
  canvas.height = 600
  const ctx = canvas.getContext("2d")

  if (ctx) {
    // Gray background
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Error icon (simple X)
    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(170, 250)
    ctx.lineTo(230, 310)
    ctx.moveTo(230, 250)
    ctx.lineTo(170, 310)
    ctx.stroke()

    // Error text
    ctx.fillStyle = "#374151"
    ctx.font = "16px system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(`Page ${pageNum} failed to render`, 200, 350)

    // Error message
    ctx.fillStyle = "#9ca3af"
    ctx.font = "12px system-ui, sans-serif"
    const message = error instanceof Error ? error.message : "Unknown error"
    ctx.fillText(message.slice(0, 40), 200, 380)
  }

  return canvasToBlob(canvas, "image/png", 1)
}

/**
 * Extract a clean title from the PDF filename
 */
function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Get metadata from a PDF without rendering pages
 * Useful for quick file info display
 */
export async function getPdfMetadata(
  file: File,
  password?: string
): Promise<{
  title: string
  author: string | null
  subject: string | null
  creator: string | null
  producer: string | null
  creationDate: Date | null
  modificationDate: Date | null
  pageCount: number
}> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjs.getDocument({
    data: arrayBuffer,
    password,
  }).promise

  const metadata = await pdf.getMetadata()
  const info = metadata.info as Record<string, unknown>

  const parseDate = (dateStr: unknown): Date | null => {
    if (typeof dateStr !== "string") return null
    // PDF date format: D:YYYYMMDDHHmmss
    const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/)
    if (match) {
      const [, year, month, day, hour = "00", min = "00", sec = "00"] = match
      return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`)
    }
    return null
  }

  const result = {
    title: (info.Title as string) || extractTitleFromFilename(file.name),
    author: (info.Author as string) || null,
    subject: (info.Subject as string) || null,
    creator: (info.Creator as string) || null,
    producer: (info.Producer as string) || null,
    creationDate: parseDate(info.CreationDate),
    modificationDate: parseDate(info.ModDate),
    pageCount: pdf.numPages,
  }

  pdf.destroy()
  return result
}

/**
 * Render a single page from a PDF file
 * Useful for generating thumbnails or on-demand page loading
 */
export async function renderSinglePdfPage(
  file: File,
  pageNumber: number,
  options: {
    scale?: number
    imageFormat?: "image/png" | "image/jpeg" | "image/webp"
    imageQuality?: number
    password?: string
  } = {}
): Promise<Blob> {
  const { scale = 2, imageFormat = "image/png", imageQuality = 0.92, password } = options

  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjs.getDocument({
    data: arrayBuffer,
    password,
  }).promise

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    pdf.destroy()
    throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`)
  }

  try {
    const blob = await renderPage(pdf, pageNumber, scale, imageFormat, imageQuality)
    return blob
  } finally {
    pdf.destroy()
  }
}

/**
 * Custom error class for password-related errors
 */
export class PdfPasswordError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PdfPasswordError"
  }
}

/**
 * Custom error class for general PDF parsing errors
 */
export class PdfParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PdfParseError"
  }
}

/**
 * Check if a file is a valid PDF by examining its magic bytes
 */
export async function isPdfFile(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 5).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // PDF magic bytes: %PDF-
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  )
}
