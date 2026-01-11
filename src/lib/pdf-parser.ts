import type { ComicFormat } from "./types"
import type { PDFDocumentProxy } from "pdfjs-dist"

// Lazy-load pdfjs to reduce initial bundle size
let pdfjsLib: typeof import("pdfjs-dist") | null = null
let workerInitialized = false

async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
  }

  // Initialize worker only once
  if (!workerInitialized) {
    // Use the legacy build which includes the worker inline
    // This avoids CORS and bundler issues with external worker files
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
    workerInitialized = true
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

  if (signal?.aborted) {
    throw new DOMException("PDF parsing was cancelled", "AbortError")
  }

  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  if (signal?.aborted) {
    throw new DOMException("PDF parsing was cancelled", "AbortError")
  }

  let pdf: PDFDocumentProxy

  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      password,
    })

    pdf = await loadingTask.promise
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "PasswordException" || error.message.includes("password")) {
        throw new PdfPasswordError("PDF requires a password to open")
      }
    }
    throw new PdfParseError(
      `Failed to load PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  const pages: Blob[] = []
  const totalPages = pdf.numPages

  onProgress?.(0, totalPages)

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (signal?.aborted) {
      await pdf.destroy()
      throw new DOMException("PDF parsing was cancelled", "AbortError")
    }

    try {
      const blob = await renderPageToBlob(pdf, pageNum, scale, imageFormat, imageQuality)
      pages.push(blob)
      onProgress?.(pageNum, totalPages)
    } catch (error) {
      console.error(`[pdf-parser] Error rendering page ${pageNum}:`, error)
      const placeholderBlob = await createErrorPageBlob(pageNum, error)
      pages.push(placeholderBlob)
      onProgress?.(pageNum, totalPages)
    }
  }

  await pdf.destroy()

  return {
    pages,
    metadata: {
      title: extractTitleFromFilename(file.name),
      totalPages,
      fileName: file.name,
      fileSize: file.size,
      format: "pdf",
    },
  }
}

/**
 * Render a single PDF page to a blob
 */
async function renderPageToBlob(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale: number,
  imageFormat: string,
  imageQuality: number
): Promise<Blob> {
  const page = await pdf.getPage(pageNum)

  try {
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) {
      throw new Error(`Failed to get canvas context for page ${pageNum}`)
    }

    // White background for PDFs with transparency
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render the page - canvas: null is required in pdfjs-dist v5 when using canvasContext
    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: null,
    }).promise

    const blob = await canvasToBlob(canvas, imageFormat, imageQuality)

    // Cleanup
    canvas.width = 0
    canvas.height = 0

    return blob
  } finally {
    page.cleanup()
  }
}

/**
 * Convert canvas to blob
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
 * Create a placeholder image for failed pages
 */
async function createErrorPageBlob(pageNum: number, error: unknown): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = 400
  canvas.height = 600
  const ctx = canvas.getContext("2d")

  if (ctx) {
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = "#ef4444"
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(170, 250)
    ctx.lineTo(230, 310)
    ctx.moveTo(230, 250)
    ctx.lineTo(170, 310)
    ctx.stroke()

    ctx.fillStyle = "#374151"
    ctx.font = "16px system-ui, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(`Page ${pageNum} failed to render`, 200, 350)

    ctx.fillStyle = "#9ca3af"
    ctx.font = "12px system-ui, sans-serif"
    const message = error instanceof Error ? error.message : "Unknown error"
    ctx.fillText(message.slice(0, 40), 200, 380)
  }

  return canvasToBlob(canvas, "image/png", 1)
}

/**
 * Extract a clean title from filename
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
    data: new Uint8Array(arrayBuffer),
    password,
  }).promise

  const metadata = await pdf.getMetadata()
  const info = metadata.info as Record<string, unknown>

  const parseDate = (dateStr: unknown): Date | null => {
    if (typeof dateStr !== "string") return null
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

  await pdf.destroy()
  return result
}

/**
 * Render a single page from a PDF file (for thumbnails)
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
    data: new Uint8Array(arrayBuffer),
    password,
  }).promise

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    await pdf.destroy()
    throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`)
  }

  try {
    const blob = await renderPageToBlob(pdf, pageNumber, scale, imageFormat, imageQuality)
    return blob
  } finally {
    await pdf.destroy()
  }
}

/**
 * Custom error for password-related errors
 */
export class PdfPasswordError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PdfPasswordError"
  }
}

/**
 * Custom error for general PDF parsing errors
 */
export class PdfParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PdfParseError"
  }
}

/**
 * Check if a file is a valid PDF by examining magic bytes
 */
export async function isPdfFile(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 5).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d // -
  )
}
