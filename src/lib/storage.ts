import type { Comic, Bookmark, Note, ComicList } from "./types"

const DB_NAME = "comic-reader-db"
const DB_VERSION = 3
const COMICS_STORE = "comics"
const PAGES_STORE = "pages"
const BOOKMARKS_STORE = "bookmarks"
const NOTES_STORE = "notes"
const LISTS_STORE = "lists"

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

      // Pages store
      if (!database.objectStoreNames.contains(PAGES_STORE)) {
        const pagesStore = database.createObjectStore(PAGES_STORE, { keyPath: ["comicId", "pageNumber"] })
        pagesStore.createIndex("comicId", "comicId", { unique: false })
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
      [COMICS_STORE, PAGES_STORE, BOOKMARKS_STORE, NOTES_STORE, LISTS_STORE],
      "readwrite",
    )

    // Delete comic
    const comicsStore = transaction.objectStore(COMICS_STORE)
    comicsStore.delete(id)

    // Delete all pages for this comic
    const pagesStore = transaction.objectStore(PAGES_STORE)
    const index = pagesStore.index("comicId")
    const pagesCursor = index.openCursor(IDBKeyRange.only(id))

    pagesCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        pagesStore.delete(cursor.primaryKey)
        cursor.continue()
      }
    }

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

export async function savePage(comicId: string, pageNumber: number, blob: Blob): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PAGES_STORE], "readwrite")
    const store = transaction.objectStore(PAGES_STORE)
    const request = store.put({ comicId, pageNumber, blob })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getPage(comicId: string, pageNumber: number): Promise<Blob | null> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PAGES_STORE], "readonly")
    const store = transaction.objectStore(PAGES_STORE)
    const request = store.get([comicId, pageNumber])

    request.onsuccess = () => resolve(request.result?.blob || null)
    request.onerror = () => reject(request.error)
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
  pages: { comicId: string; pageNumber: number; data: string }[] // base64 encoded
}

async function getAllPages(): Promise<{ comicId: string; pageNumber: number; blob: Blob }[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([PAGES_STORE], "readonly")
    const store = transaction.objectStore(PAGES_STORE)
    const request = store.getAll()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(",")
  const mime = parts[0].match(/:(.*?);/)?.[1] || "application/octet-stream"
  const data = atob(parts[1])
  const array = new Uint8Array(data.length)
  for (let i = 0; i < data.length; i++) {
    array[i] = data.charCodeAt(i)
  }
  return new Blob([array], { type: mime })
}

export async function exportLibrary(includeFiles: boolean = true): Promise<Blob> {
  const comics = await getAllComics()
  const bookmarks = await getAllBookmarks()
  const notes = await getAllNotes()
  const lists = await getAllLists()

  let pages: { comicId: string; pageNumber: number; data: string }[] = []

  if (includeFiles) {
    const allPages = await getAllPages()
    pages = await Promise.all(
      allPages.map(async (page) => ({
        comicId: page.comicId,
        pageNumber: page.pageNumber,
        data: await blobToBase64(page.blob),
      }))
    )
  }

  const exportData: ExportData = {
    version: 1,
    exportDate: new Date().toISOString(),
    comics,
    bookmarks,
    notes,
    lists,
    pages,
  }

  const json = JSON.stringify(exportData)
  return new Blob([json], { type: "application/json" })
}

export async function importLibrary(file: File, options: { merge: boolean } = { merge: false }): Promise<{ comics: number; bookmarks: number; notes: number; lists: number; pages: number }> {
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
        [COMICS_STORE, PAGES_STORE, BOOKMARKS_STORE, NOTES_STORE, LISTS_STORE],
        "readwrite"
      )
      transaction.objectStore(COMICS_STORE).clear()
      transaction.objectStore(PAGES_STORE).clear()
      transaction.objectStore(BOOKMARKS_STORE).clear()
      transaction.objectStore(NOTES_STORE).clear()
      transaction.objectStore(LISTS_STORE).clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // Import comics
  for (const comic of data.comics) {
    // Convert date strings back to Date objects
    if (comic.lastRead) comic.lastRead = new Date(comic.lastRead)
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

  // Import pages
  for (const page of data.pages) {
    const blob = base64ToBlob(page.data)
    await savePage(page.comicId, page.pageNumber, blob)
  }

  return {
    comics: data.comics.length,
    bookmarks: data.bookmarks.length,
    notes: data.notes.length,
    lists: data.lists.length,
    pages: data.pages.length,
  }
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
