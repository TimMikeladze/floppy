import type { Comic, Bookmark, Note, ComicList, ComicSource, RemotePages } from "./types"

const DB_NAME = "comic-reader-db"
const DB_VERSION = 6
const COMICS_STORE = "comics"
const PAGES_STORE = "pages" // For iOS/Safari - stores pages when File System Access unavailable
const BOOKMARKS_STORE = "bookmarks"
const NOTES_STORE = "notes"
const LISTS_STORE = "lists"
const SOURCES_STORE = "sources" // Data sources (CSV imports)
const REMOTE_PAGES_STORE = "remotePages" // Page URLs for remote comics

let db: IDBDatabase | null = null

async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Comics store
      if (!database.objectStoreNames.contains(COMICS_STORE)) {
        const comicsStore = database.createObjectStore(COMICS_STORE, { keyPath: "id" })
        comicsStore.createIndex("lastRead", "lastRead", { unique: false })
        comicsStore.createIndex("title", "title", { unique: false })
      }

      // Pages store - for iOS/Safari where File System Access API is unavailable
      if (!database.objectStoreNames.contains(PAGES_STORE)) {
        database.createObjectStore(PAGES_STORE, { keyPath: "comicId" })
      }

      // Bookmarks store
      if (!database.objectStoreNames.contains(BOOKMARKS_STORE)) {
        const bookmarksStore = database.createObjectStore(BOOKMARKS_STORE, { keyPath: "id" })
        bookmarksStore.createIndex("comicId", "comicId", { unique: false })
        bookmarksStore.createIndex("pageNumber", "pageNumber", { unique: false })
      }

      // Notes store
      if (!database.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = database.createObjectStore(NOTES_STORE, { keyPath: "id" })
        notesStore.createIndex("comicId", "comicId", { unique: false })
        notesStore.createIndex("pageNumber", "pageNumber", { unique: false })
      }

      // Lists store
      if (!database.objectStoreNames.contains(LISTS_STORE)) {
        database.createObjectStore(LISTS_STORE, { keyPath: "id" })
      }

      // Sources store (data sources like CSV imports)
      if (!database.objectStoreNames.contains(SOURCES_STORE)) {
        database.createObjectStore(SOURCES_STORE, { keyPath: "id" })
      }

      // Remote pages store (page URLs for remote comics)
      if (!database.objectStoreNames.contains(REMOTE_PAGES_STORE)) {
        const remotePagesStore = database.createObjectStore(REMOTE_PAGES_STORE, { keyPath: "comicId" })
        remotePagesStore.createIndex("comicId", "comicId", { unique: true })
      }
    }
  })
}

export async function saveComic(comic: Comic): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COMICS_STORE], "readwrite")
    const store = transaction.objectStore(COMICS_STORE)
    const request = store.put(comic)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getComic(id: string): Promise<Comic | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COMICS_STORE], "readonly")
    const store = transaction.objectStore(COMICS_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllComics(): Promise<Comic[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COMICS_STORE], "readonly")
    const store = transaction.objectStore(COMICS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteComic(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [COMICS_STORE, PAGES_STORE, BOOKMARKS_STORE, NOTES_STORE, LISTS_STORE, REMOTE_PAGES_STORE],
      "readwrite",
    )

    // Delete comic
    const comicsStore = transaction.objectStore(COMICS_STORE)
    comicsStore.delete(id)

    // Delete pages (for iOS/Safari storage)
    const pagesStore = transaction.objectStore(PAGES_STORE)
    pagesStore.delete(id)

    // Delete remote pages (for remote comics)
    const remotePagesStore = transaction.objectStore(REMOTE_PAGES_STORE)
    remotePagesStore.delete(id)

    // Delete all bookmarks for this comic
    const bookmarksStore = transaction.objectStore(BOOKMARKS_STORE)
    const bookmarksIndex = bookmarksStore.index("comicId")
    const bookmarksCursor = bookmarksIndex.openCursor(IDBKeyRange.only(id))

    bookmarksCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        bookmarksStore.delete(cursor.primaryKey)
        cursor.continue()
      }
    }

    // Delete all notes for this comic
    const notesStore = transaction.objectStore(NOTES_STORE)
    const notesIndex = notesStore.index("comicId")
    const notesCursor = notesIndex.openCursor(IDBKeyRange.only(id))

    notesCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        notesStore.delete(cursor.primaryKey)
        cursor.continue()
      }
    }

    // Remove comic from all lists
    const listsStore = transaction.objectStore(LISTS_STORE)
    const listsCursor = listsStore.openCursor()

    listsCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const list = cursor.value
        list.comicIds = list.comicIds.filter((comicId: string) => comicId !== id)
        listsStore.put(list)
        cursor.continue()
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function updateReadingProgress(comicId: string, currentPage: number): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COMICS_STORE], "readwrite")
    const store = transaction.objectStore(COMICS_STORE)
    const request = store.get(comicId)

    request.onsuccess = () => {
      const comic = request.result
      if (comic) {
        comic.currentPage = currentPage
        comic.lastRead = new Date()
        store.put(comic)
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// File System Access API helpers
export async function verifyFilePermission(
  fileHandle: FileSystemFileHandle,
  withWrite = false
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = { mode: withWrite ? "readwrite" : "read" }

  // Check if permission is already granted
  if ((await fileHandle.queryPermission(options)) === "granted") {
    return true
  }

  // Request permission
  if ((await fileHandle.requestPermission(options)) === "granted") {
    return true
  }

  return false
}

export async function getFileFromHandle(fileHandle: FileSystemFileHandle): Promise<File | null> {
  try {
    const hasPermission = await verifyFilePermission(fileHandle)
    if (!hasPermission) {
      return null
    }
    return await fileHandle.getFile()
  } catch (error) {
    console.error("[storage] Error getting file from handle:", error)
    return null
  }
}

export function isFileSystemAccessSupported(): boolean {
  return "showOpenFilePicker" in window
}

/**
 * Load comic pages directly from a file handle.
 * All formats (CBZ, CBR, PDF, EPUB) are parsed to image blobs.
 */
export async function loadPagesFromHandle(
  fileHandle: FileSystemFileHandle,
  format: "cbz" | "cbr" | "pdf" | "epub"
): Promise<{ pages: Blob[] } | null> {
  try {
    const file = await getFileFromHandle(fileHandle)
    if (!file) {
      return null
    }

    const { parseComicFile } = await import("./comic-parser")
    const result = await parseComicFile(file)

    return { pages: result.pages }
  } catch (error) {
    console.error("[storage] Error loading pages from handle:", error)
    return null
  }
}

/**
 * Save comic pages to IndexedDB.
 * Used for iOS/Safari where File System Access API is unavailable.
 */
export async function savePagesForComic(comicId: string, pages: Blob[]): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PAGES_STORE], "readwrite")
    const store = transaction.objectStore(PAGES_STORE)
    const request = store.put({ comicId, pages })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get comic pages from IndexedDB.
 * Used for iOS/Safari where File System Access API is unavailable.
 */
export async function getPagesForComic(comicId: string): Promise<Blob[] | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PAGES_STORE], "readonly")
    const store = transaction.objectStore(PAGES_STORE)
    const request = store.get(comicId)

    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.pages : null)
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Delete pages for a comic from IndexedDB.
 */
export async function deletePagesForComic(comicId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PAGES_STORE], "readwrite")
    const store = transaction.objectStore(PAGES_STORE)
    const request = store.delete(comicId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all cached pages from IndexedDB (frees storage without deleting comics).
 */
export async function clearAllCachedPages(): Promise<number> {
  const database = await initDB()
  const comics = await getAllComics()
  let clearedCount = 0

  for (const comic of comics) {
    const pages = await getPagesForComic(comic.id)
    if (pages && pages.length > 0) {
      await deletePagesForComic(comic.id)
      clearedCount++
    }
  }

  return clearedCount
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BOOKMARKS_STORE], "readwrite")
    const store = transaction.objectStore(BOOKMARKS_STORE)
    const request = store.put(bookmark)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getBookmarks(comicId: string): Promise<Bookmark[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BOOKMARKS_STORE], "readonly")
    const store = transaction.objectStore(BOOKMARKS_STORE)
    const index = store.index("comicId")
    const request = index.getAll(comicId)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BOOKMARKS_STORE], "readwrite")
    const store = transaction.objectStore(BOOKMARKS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function saveNote(note: Note): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([NOTES_STORE], "readwrite")
    const store = transaction.objectStore(NOTES_STORE)
    const request = store.put(note)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getNotes(comicId: string, pageNumber?: number): Promise<Note[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([NOTES_STORE], "readonly")
    const store = transaction.objectStore(NOTES_STORE)
    const index = store.index("comicId")
    const request = index.getAll(comicId)

    request.onsuccess = () => {
      let results = request.result
      if (pageNumber !== undefined) {
        results = results.filter((note) => note.pageNumber === pageNumber)
      }
      resolve(results)
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteNote(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([NOTES_STORE], "readwrite")
    const store = transaction.objectStore(NOTES_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllBookmarks(): Promise<Bookmark[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([BOOKMARKS_STORE], "readonly")
    const store = transaction.objectStore(BOOKMARKS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllNotes(): Promise<Note[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([NOTES_STORE], "readonly")
    const store = transaction.objectStore(NOTES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveList(list: ComicList): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LISTS_STORE], "readwrite")
    const store = transaction.objectStore(LISTS_STORE)
    const request = store.put(list)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getAllLists(): Promise<ComicList[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LISTS_STORE], "readonly")
    const store = transaction.objectStore(LISTS_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteList(id: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LISTS_STORE], "readwrite")
    const store = transaction.objectStore(LISTS_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function addComicToList(listId: string, comicId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LISTS_STORE], "readwrite")
    const store = transaction.objectStore(LISTS_STORE)
    const request = store.get(listId)

    request.onsuccess = () => {
      const list = request.result
      if (list && !list.comicIds.includes(comicId)) {
        list.comicIds.push(comicId)
        store.put(list)
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function removeComicFromList(listId: string, comicId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LISTS_STORE], "readwrite")
    const store = transaction.objectStore(LISTS_STORE)
    const request = store.get(listId)

    request.onsuccess = () => {
      const list = request.result
      if (list) {
        list.comicIds = list.comicIds.filter((id: string) => id !== comicId)
        store.put(list)
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// ============ IMPORT/EXPORT ============

interface ExportData {
  version: number
  exportDate: string
  comics: Comic[]
  bookmarks: Bookmark[]
  notes: Note[]
  lists: ComicList[]
}

export async function exportLibrary(): Promise<Blob> {
  const comics = await getAllComics()
  const bookmarks = await getAllBookmarks()
  const notes = await getAllNotes()
  const lists = await getAllLists()

  // Strip fileHandle from comics (not serializable)
  const exportableComics = comics.map(({ fileHandle, ...rest }) => rest)

  const exportData: ExportData = {
    version: 2,
    exportDate: new Date().toISOString(),
    comics: exportableComics,
    bookmarks,
    notes,
    lists,
  }

  const json = JSON.stringify(exportData)
  return new Blob([json], { type: "application/json" })
}

export async function importLibrary(file: File, options: { merge: boolean } = { merge: false }): Promise<{ comics: number; bookmarks: number; notes: number; lists: number }> {
  const text = await file.text()
  const data: ExportData = JSON.parse(text)

  if (!data.version || !data.comics) {
    throw new Error("Invalid backup file format")
  }

  // Clear existing data if not merging
  if (!options.merge) {
    const database = await initDB()
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        [COMICS_STORE, BOOKMARKS_STORE, NOTES_STORE, LISTS_STORE],
        "readwrite"
      )
      transaction.objectStore(COMICS_STORE).clear()
      transaction.objectStore(BOOKMARKS_STORE).clear()
      transaction.objectStore(NOTES_STORE).clear()
      transaction.objectStore(LISTS_STORE).clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // Import comics (without file handles - user must re-attach files)
  for (const comic of data.comics) {
    if (comic.lastRead) comic.lastRead = new Date(comic.lastRead)
    // Mark as needing file re-attachment
    comic.hasFile = false
    comic.fileHandle = undefined
    await saveComic(comic)
  }

  // Import bookmarks
  for (const bookmark of data.bookmarks) {
    bookmark.createdAt = new Date(bookmark.createdAt)
    await saveBookmark(bookmark)
  }

  // Import notes
  for (const note of data.notes) {
    note.createdAt = new Date(note.createdAt)
    note.updatedAt = new Date(note.updatedAt)
    await saveNote(note)
  }

  // Import lists
  for (const list of data.lists) {
    list.createdAt = new Date(list.createdAt)
    await saveList(list)
  }

  return {
    comics: data.comics.length,
    bookmarks: data.bookmarks.length,
    notes: data.notes.length,
    lists: data.lists.length,
  }
}

/**
 * Clear all data from IndexedDB (comics, pages, bookmarks, notes, lists, sources, remote pages).
 * This is destructive and cannot be undone.
 */
export async function clearAllData(): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [COMICS_STORE, PAGES_STORE, BOOKMARKS_STORE, NOTES_STORE, LISTS_STORE, SOURCES_STORE, REMOTE_PAGES_STORE],
      "readwrite"
    )
    transaction.objectStore(COMICS_STORE).clear()
    transaction.objectStore(PAGES_STORE).clear()
    transaction.objectStore(BOOKMARKS_STORE).clear()
    transaction.objectStore(NOTES_STORE).clear()
    transaction.objectStore(LISTS_STORE).clear()
    transaction.objectStore(SOURCES_STORE).clear()
    transaction.objectStore(REMOTE_PAGES_STORE).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function initializeDefaultLists(): Promise<void> {
  const lists = await getAllLists()
  if (lists.length === 0) {
    const defaultLists: ComicList[] = [
      {
        id: crypto.randomUUID(),
        name: "Reading",
        color: "#3b82f6",
        createdAt: new Date(),
        comicIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Completed",
        color: "#10b981",
        createdAt: new Date(),
        comicIds: [],
      },
      {
        id: crypto.randomUUID(),
        name: "Want to Read",
        color: "#f59e0b",
        createdAt: new Date(),
        comicIds: [],
      },
    ]

    for (const list of defaultLists) {
      await saveList(list)
    }
  }
}

// ============ SOURCES (Data Sources) ============

export async function saveSource(source: ComicSource): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SOURCES_STORE], "readwrite")
    const store = transaction.objectStore(SOURCES_STORE)
    const request = store.put(source)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getSource(id: string): Promise<ComicSource | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SOURCES_STORE], "readonly")
    const store = transaction.objectStore(SOURCES_STORE)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllSources(): Promise<ComicSource[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SOURCES_STORE], "readonly")
    const store = transaction.objectStore(SOURCES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteSource(id: string): Promise<void> {
  const database = await initDB()

  // First, get all comics with this sourceId and delete them
  const comics = await getAllComics()
  const comicsToDelete = comics.filter(c => c.sourceId === id)

  for (const comic of comicsToDelete) {
    await deleteComic(comic.id)
  }

  // Then delete the source itself
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SOURCES_STORE], "readwrite")
    const store = transaction.objectStore(SOURCES_STORE)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ============ REMOTE PAGES ============

export async function saveRemotePages(remotePages: RemotePages): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([REMOTE_PAGES_STORE], "readwrite")
    const store = transaction.objectStore(REMOTE_PAGES_STORE)
    const request = store.put(remotePages)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getRemotePages(comicId: string): Promise<RemotePages | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([REMOTE_PAGES_STORE], "readonly")
    const store = transaction.objectStore(REMOTE_PAGES_STORE)
    const request = store.get(comicId)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteRemotePages(comicId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([REMOTE_PAGES_STORE], "readwrite")
    const store = transaction.objectStore(REMOTE_PAGES_STORE)
    const request = store.delete(comicId)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// ============ STORAGE MANAGEMENT ============

export interface StorageStats {
  totalSize: number
  comicsCount: number
  pagesSize: number
  bookmarksCount: number
  notesCount: number
  listsCount: number
  sourcesCount: number
  remotePagesCount: number
}

export interface ComicStorageInfo {
  id: string
  title: string
  coverSize: number
  pagesSize: number
  totalSize: number
  hasValidHandle: boolean
  sourceType: "local" | "remote"
}

/**
 * Estimate the size of a value in bytes (rough approximation for IndexedDB storage)
 */
function estimateSize(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (value instanceof Blob) return value.size
  if (typeof value === "string") return value.length * 2 // UTF-16
  if (typeof value === "number") return 8
  if (typeof value === "boolean") return 4
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => acc + estimateSize(item), 0)
  }
  if (typeof value === "object") {
    return Object.entries(value).reduce(
      (acc, [key, val]) => acc + key.length * 2 + estimateSize(val),
      0
    )
  }
  return 0
}

/**
 * Get storage statistics for all IndexedDB data
 */
export async function getStorageStats(): Promise<StorageStats> {
  const comics = await getAllComics()
  const bookmarks = await getAllBookmarks()
  const notes = await getAllNotes()
  const lists = await getAllLists()
  const sources = await getAllSources()

  // Calculate pages size
  let pagesSize = 0
  for (const comic of comics) {
    const pages = await getPagesForComic(comic.id)
    if (pages) {
      pagesSize += pages.reduce((acc, blob) => acc + blob.size, 0)
    }
  }

  // Estimate total size
  const comicsSize = comics.reduce((acc, comic) => {
    // Cover images are base64 encoded, estimate their size
    const coverSize = comic.coverImage ? comic.coverImage.length : 0
    return acc + coverSize + estimateSize(comic)
  }, 0)

  return {
    totalSize: comicsSize + pagesSize,
    comicsCount: comics.length,
    pagesSize,
    bookmarksCount: bookmarks.length,
    notesCount: notes.length,
    listsCount: lists.length,
    sourcesCount: sources.length,
    remotePagesCount: comics.filter(c => c.sourceType === "remote").length,
  }
}

/**
 * Get storage info for each comic
 */
export async function getComicStorageInfo(): Promise<ComicStorageInfo[]> {
  const comics = await getAllComics()
  const results: ComicStorageInfo[] = []

  for (const comic of comics) {
    const coverSize = comic.coverImage ? comic.coverImage.length : 0
    let pagesSize = 0

    const pages = await getPagesForComic(comic.id)
    if (pages) {
      pagesSize = pages.reduce((acc, blob) => acc + blob.size, 0)
    }

    // Check if file handle is valid (for local comics)
    let hasValidHandle = false
    if (comic.sourceType === "local" && comic.fileHandle) {
      try {
        const permission = await comic.fileHandle.queryPermission({ mode: "read" })
        hasValidHandle = permission === "granted"
      } catch {
        hasValidHandle = false
      }
    }

    results.push({
      id: comic.id,
      title: comic.title,
      coverSize,
      pagesSize,
      totalSize: coverSize + pagesSize,
      hasValidHandle,
      sourceType: comic.sourceType,
    })
  }

  return results.sort((a, b) => b.totalSize - a.totalSize)
}

/**
 * Re-validate all file handles and return status for each comic
 */
export async function revalidateFileHandles(): Promise<{
  valid: string[]
  invalid: string[]
  remote: string[]
}> {
  const comics = await getAllComics()
  const valid: string[] = []
  const invalid: string[] = []
  const remote: string[] = []

  for (const comic of comics) {
    if (comic.sourceType === "remote") {
      remote.push(comic.id)
      continue
    }

    if (!comic.fileHandle) {
      invalid.push(comic.id)
      continue
    }

    try {
      const permission = await comic.fileHandle.queryPermission({ mode: "read" })
      if (permission === "granted") {
        valid.push(comic.id)
      } else {
        // Try to request permission
        const newPermission = await comic.fileHandle.requestPermission({ mode: "read" })
        if (newPermission === "granted") {
          valid.push(comic.id)
        } else {
          invalid.push(comic.id)
        }
      }
    } catch {
      invalid.push(comic.id)
    }
  }

  return { valid, invalid, remote }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
