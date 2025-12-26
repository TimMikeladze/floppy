import JSZip from "jszip"
import type { ComicFormat } from "./types"
import { parseCbrFile } from "./cbr-parser"
import { parsePdfFile } from "./pdf-parser"

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
 */
export async function parseComicFile(file: File): Promise<ParseResult> {
  const format = detectFormat(file)

  try {
    switch (format) {
      case "cbr":
        return await parseCbrFile(file)
      case "pdf":
        return await parsePdfFile(file)
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

  const imageFiles = Object.keys(contents.files)
    .filter((fileName) => {
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."))
      return (
        IMAGE_EXTENSIONS.includes(ext) &&
        !fileName.startsWith("__MACOSX") &&
        !contents.files[fileName].dir
      )
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))

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

export const SUPPORTED_FORMATS = {
  extensions: [".cbz", ".zip", ".cbr", ".rar", ".pdf"],
  accept: ".cbz,.zip,.cbr,.rar,.pdf",
  description: "CBZ, CBR, PDF",
}
