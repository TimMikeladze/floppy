export type ComicFormat = "cbz" | "cbr" | "pdf"
export type PdfRenderMode = "image" | "native"

export interface Comic {
  id: string
  title: string
  coverImage: string // base64 data URL for the cover
  totalPages: number | null
  currentPage: number
  lastRead?: Date
  series?: string
  issue?: string
  fileSize?: number
  fileName?: string
  hasFile: boolean
  author?: string
  publisher?: string
  releaseDate?: string
  format?: ComicFormat
  pdfRenderMode?: PdfRenderMode
  // File handle for File System Access API - allows re-reading file from disk
  fileHandle?: FileSystemFileHandle
}

export interface ComicPage {
  pageNumber: number
  imageUrl: string
  blob?: Blob
}

export interface ReadingSettings {
  theme: "light" | "dark"
  pageLayout: "single" | "double"
  pageTransition: "slide" | "fade" | "instant"
  readingDirection: "ltr" | "rtl"
  fitMode: "fit-width" | "fit-height" | "original"
  brightness: number
  layoutMode?: "paged" | "scrolling"
}

export interface Bookmark {
  id: string
  comicId: string
  pageNumber: number
  createdAt: Date
  note?: string
  thumbnailUrl?: string
  tags?: string[]
}

export interface Note {
  id: string
  comicId: string
  pageNumber: number
  content: string
  createdAt: Date
  updatedAt: Date
  position?: {
    x: number
    y: number
  }
  color?: string
}

export interface ComicList {
  id: string
  name: string
  color: string
  createdAt: Date
  comicIds: string[]
}
