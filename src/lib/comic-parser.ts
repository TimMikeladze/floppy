import JSZip from "jszip"
import type { ComicFormat, PdfRenderMode } from "./types"
import { parseCbrFile } from "./cbr-parser"
import { parsePdfAsImages, parsePdfNative, renderPdfPage, getPdfInfo } from "./pdf-parser"

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
  pdfData?: ArrayBuffer // For native PDF rendering
}

/**
 * Detect file format from extension and magic bytes
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
      // Default to CBZ for unknown extensions
      return "cbz"
  }
}

/**
 * Parse any supported comic file format
 * Routes to format-specific parser based on file extension
 */
export async function parseComicFile(
  file: File,
  options?: { pdfMode?: PdfRenderMode }
): Promise<ParseResult> {
  const format = detectFormat(file)

  try {
    switch (format) {
      case "cbr":
        return await parseCbrFile(file)

      case "pdf":
        if (options?.pdfMode === "native") {
          return await parsePdfNative(file)
        }
        return await parsePdfAsImages(file)

      case "cbz":
      default:
        return await parseCbzFile(file)
    }
  } catch (error) {
    console.error(`[comic-parser] Error parsing ${format} file:`, error)
    throw new Error(`Failed to parse ${format.toUpperCase()} file. Please ensure it is valid.`)
  }
}

/**
 * Parse CBZ/ZIP files
 */
async function parseCbzFile(file: File): Promise<ParseResult> {
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  // Get all image files and sort them
  const imageFiles = Object.keys(contents.files)
    .filter((fileName) => {
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."))
      return (
        IMAGE_EXTENSIONS.includes(ext) &&
        !fileName.startsWith("__MACOSX") &&
        !contents.files[fileName].dir
      )
    })
    .sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    })

  // Extract all images as blobs
  const pages: Blob[] = []
  for (const fileName of imageFiles) {
    const zipFile = contents.files[fileName]
    const blob = await zipFile.async("blob")
    pages.push(blob)
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

// Re-export PDF utilities for native rendering mode
export { renderPdfPage, getPdfInfo }

// Export supported formats for UI
export const SUPPORTED_FORMATS = {
  extensions: [".cbz", ".zip", ".cbr", ".rar", ".pdf"],
  accept: ".cbz,.zip,.cbr,.rar,.pdf",
  description: "CBZ, CBR, PDF",
}
