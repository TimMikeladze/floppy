"use client"

import { useEffect, useCallback, useRef } from "react"

export interface LibraryPreferences {
  sortBy: "title" | "recent" | "progress"
  viewMode: "grid" | "table" | "series"
  filter: "all" | "reading" | "completed" | "want"
  selectedListId: string | null
}

const STORAGE_KEY = "floppy-library-preferences"

const defaultPreferences: LibraryPreferences = {
  sortBy: "recent",
  viewMode: "grid",
  filter: "all",
  selectedListId: null,
}

export function getStoredLibraryPreferences(): LibraryPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...defaultPreferences,
        ...parsed,
      }
    }
  } catch (e) {
    console.error("Failed to parse library preferences from localStorage", e)
  }

  return defaultPreferences
}

export function saveLibraryPreferences(preferences: Partial<LibraryPreferences>): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = getStoredLibraryPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error("Failed to save library preferences to localStorage", e)
  }
}

export function useLibraryPreferences() {
  const hasInitialized = useRef(false)

  // Persist changes to localStorage
  const persistPreferences = useCallback((preferences: Partial<LibraryPreferences>) => {
    saveLibraryPreferences(preferences)
  }, [])

  return {
    getStoredPreferences: getStoredLibraryPreferences,
    persistPreferences,
    hasInitialized,
  }
}
