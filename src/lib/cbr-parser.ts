import { Archive } from "libarchive.js"
import type { ComicFormat } from "./types"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"]

// Track if Archive has been initialized
let archiveInitialized = false

async function initArchive() {
  if (archiveInitialized) return

  // Initialize Archive with local worker URL
  Archive.init({
    workerUrl: "/libarchive-worker.js",
  })
  archiveInitialized = true
}

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

export async function parseCbrFile(file: File): Promise<ParseResult> {
  await initArchive()

  const archive = await Archive.open(file)
  const extractedFiles = await archive.getFilesArray()

  // Filter and sort image files
  const imageFiles = extractedFiles
    .filter((entry) => {
      const name = entry.file.name.toLowerCase()
      // Skip macOS metadata
      if (entry.path.includes("__MACOSX") || name.includes("__macosx")) return false
      const ext = name.slice(name.lastIndexOf("."))
      return IMAGE_EXTENSIONS.includes(ext)
    })
    .sort((a, b) => {
      const pathA = a.path + a.file.name
      const pathB = b.path + b.file.name
      return pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: "base" })
    })

  // Extract all images as blobs
  const pages: Blob[] = []
  for (const entry of imageFiles) {
    // Extract the file (CompressedFile -> File)
    const extractedFile = await entry.file.extract()
    pages.push(extractedFile)
  }

  // Extract title from filename
  const title = file.name.replace(/\.(cbr|rar)$/i, "")

  return {
    pages,
    metadata: {
      title,
      totalPages: pages.length,
      fileName: file.name,
      fileSize: file.size,
      format: "cbr",
    },
  }
}
