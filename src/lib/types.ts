export type ComicFormat = "cbz" | "cbr" | "pdf"
export type ComicSourceType = "local" | "remote"

export interface Comic {
  id: string
  title: string
  coverImage: string // base64 data URL for the cover, or empty for remote (loaded on demand)
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
  // File handle for File System Access API - allows re-reading file from disk
  fileHandle?: FileSystemFileHandle
  // Remote source fields
  sourceType: ComicSourceType
  sourceId?: string // Links to ComicSource for remote comics
  coverUrl?: string // Remote cover URL (fetched on demand)
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
  showPageNumbers?: boolean
  toolbarPosition?: "left" | "right" | "bottom" | "top"
  swipeToTurnPages?: boolean
  hideNavigationArrows?: boolean
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
  description?: string
  icon?: string // emoji
  order?: Record<string, number> // Custom ordering within list
  isSmartList?: boolean
  smartListRules?: SmartListRule[]
}

export interface SmartListRule {
  type: 'series' | 'author' | 'publisher' | 'status' | 'progress'
  operator: 'equals' | 'contains' | 'lessThan' | 'greaterThan'
  value: string | number
}

export interface SeriesGroup {
  name: string
  normalizedName: string
  comics: Comic[]
  issueCount: number
  readCount: number
  missingIssues: number[]
  coverImage?: string
}

export interface ComicSource {
  id: string
  name: string
  importedAt: Date
  comicCount: number
  fileName?: string
}

export interface RemotePage {
  pageNumber: number
  imageUrl: string
}

export interface RemotePages {
  comicId: string
  pages: RemotePage[]
}
