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
