import JSZip from "jszip"
import type { ComicFormat } from "./types"
import { parseCbrFile, type CbrParseOptions } from "./cbr-parser"
import { parsePdfFile, PdfPasswordError, PdfParseError, type PdfParseOptions } from "./pdf-parser"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]

export interface ParseResult {
  pages: Blob[]
  metadata: {
    title: string
    totalPages: number
    fileName: string
    fileSize: number
    format: ComicFormat
  }
}

export interface ParseOptions {
  /** Progress callback - receives current page/file and total */
  onProgress?: (current: number, total: number) => void
  /** Abort signal for cancellation support */
  signal?: AbortSignal
  /** Password for protected files (PDFs) */
  password?: string
  /** Image format for PDF rendering */
  imageFormat?: "image/png" | "image/jpeg" | "image/webp"
  /** Image quality for PDF rendering (0-1) */
  imageQuality?: number
  /** Scale factor for PDF rendering */
  scale?: number
}

/**
 * Detect file format from extension
 */
export function detectFormat(file: File): ComicFormat {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))

  switch (ext) {
    case ".cbz":
    case ".zip":
      return "cbz"
    case ".cbr":
    case ".rar":
      return "cbr"
    case ".pdf":
      return "pdf"
    default:
      return "cbz"
  }
}

/**
 * Parse any supported comic file format
 *
 * Features:
 * - Progress reporting via callback
 * - Cancellation support via AbortSignal
 * - Password support for protected PDFs
 * - Configurable PDF rendering options
 */
export async function parseComicFile(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const format = detectFormat(file)
  const { onProgress, signal, password, imageFormat, imageQuality, scale } = options

  // Check for cancellation
  if (signal?.aborted) {
    throw new DOMException("Parsing was cancelled", "AbortError")
  }

  try {
    switch (format) {
      case "cbr":
        return await parseCbrFile(file, {
          onProgress,
          signal,
        } as CbrParseOptions)

      case "pdf":
        return await parsePdfFile(file, {
          onProgress,
          signal,
          password,
          imageFormat,
          imageQuality,
          scale,
        } as PdfParseOptions)

      case "cbz":
      default:
        return await parseCbzFile(file, { onProgress, signal })
    }
  } catch (error) {
    // Re-throw specific error types
    if (error instanceof PdfPasswordError) {
      throw error
    }
    if (error instanceof PdfParseError) {
      throw error
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error
    }

    console.error(`[comic-parser] Error parsing ${format} file:`, error)
    throw new Error(
      `Failed to parse ${format.toUpperCase()} file. Please ensure it is valid.`
    )
  }
}

interface CbzParseOptions {
  onProgress?: (current: number, total: number) => void
  signal?: AbortSignal
}

/**
 * Parse CBZ/ZIP files with progress reporting
 */
async function parseCbzFile(
  file: File,
  options: CbzParseOptions = {}
): Promise<ParseResult> {
  const { onProgress, signal } = options

  // Check for cancellation
  if (signal?.aborted) {
    throw new DOMException("Parsing was cancelled", "AbortError")
  }

  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  // Check for cancellation after loading
  if (signal?.aborted) {
    throw new DOMException("Parsing was cancelled", "AbortError")
  }

  const imageFiles = Object.keys(contents.files)
    .filter((fileName) => {
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."))
      return (
        IMAGE_EXTENSIONS.includes(ext) &&
        !fileName.startsWith("__MACOSX") &&
        !fileName.includes("/.") &&
        !contents.files[fileName].dir
      )
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))

  const totalPages = imageFiles.length
  const pages: Blob[] = []

  // Report initial progress
  onProgress?.(0, totalPages)

  for (let i = 0; i < imageFiles.length; i++) {
    // Check for cancellation before each file
    if (signal?.aborted) {
      throw new DOMException("Parsing was cancelled", "AbortError")
    }

    const fileName = imageFiles[i]
    const zipFile = contents.files[fileName]
    const blob = await zipFile.async("blob")
    pages.push(blob)

    // Report progress
    onProgress?.(i + 1, totalPages)
  }

  const title = file.name.replace(/\.(cbz|zip)$/i, "")

  return {
    pages,
    metadata: {
      title,
      totalPages: pages.length,
      fileName: file.name,
      fileSize: file.size,
      format: "cbz",
    },
  }
}

/**
 * Generate cover image as base64 data URL
 */
export function generateCoverImage(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Generate a thumbnail from a blob with size constraints
 */
export async function generateThumbnail(
  blob: Blob,
  maxWidth: number = 300,
  maxHeight: number = 450
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calculate scaled dimensions
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Create canvas and draw scaled image
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Failed to get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      resolve(dataUrl)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image for thumbnail"))
    }

    img.src = url
  })
}

export const SUPPORTED_FORMATS = {
  extensions: [".cbz", ".zip", ".cbr", ".rar", ".pdf"],
  accept: ".cbz,.zip,.cbr,.rar,.pdf",
  mimeTypes: [
    "application/zip",
    "application/x-cbz",
    "application/x-cbr",
    "application/x-rar-compressed",
    "application/pdf",
  ],
  description: "CBZ, CBR, PDF",
}

// Re-export error types for consumers
export { PdfPasswordError, PdfParseError } from "./pdf-parser"
