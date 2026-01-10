"use client"

import { useCallback, useSyncExternalStore } from "react"

export type GridDensity = "compact" | "comfortable" | "spacious"

export interface DisplayPreferences {
  gridDensity: GridDensity
  showNames: boolean
  showPageNumbers: boolean
}

const STORAGE_KEY = "floppy-display-preferences"

const defaultPreferences: DisplayPreferences = {
  gridDensity: "comfortable",
  showNames: true,
  showPageNumbers: true,
}

// In-memory cache for SSR
let cachedPreferences: DisplayPreferences = defaultPreferences

function getStoredDisplayPreferences(): DisplayPreferences {
  if (typeof window === "undefined") {
    return cachedPreferences
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      cachedPreferences = {
        ...defaultPreferences,
        ...parsed,
      }
      return cachedPreferences
    }
  } catch (e) {
    console.error("Failed to parse display preferences from localStorage", e)
  }

  return defaultPreferences
}

function saveDisplayPreferences(preferences: Partial<DisplayPreferences>): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = getStoredDisplayPreferences()
    const updated = { ...current, ...preferences }
    cachedPreferences = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    // Dispatch custom event to notify subscribers
    window.dispatchEvent(new CustomEvent("display-preferences-change", { detail: updated }))
  } catch (e) {
    console.error("Failed to save display preferences to localStorage", e)
  }
}

// Subscribe function for useSyncExternalStore
function subscribe(callback: () => void): () => void {
  const handleChange = () => callback()
  window.addEventListener("display-preferences-change", handleChange)
  window.addEventListener("storage", handleChange)
  return () => {
    window.removeEventListener("display-preferences-change", handleChange)
    window.removeEventListener("storage", handleChange)
  }
}

// Server snapshot
function getServerSnapshot(): DisplayPreferences {
  return defaultPreferences
}

export function useDisplayPreferences() {
  const preferences = useSyncExternalStore(
    subscribe,
    getStoredDisplayPreferences,
    getServerSnapshot
  )

  const updatePreferences = useCallback((updates: Partial<DisplayPreferences>) => {
    saveDisplayPreferences(updates)
  }, [])

  return {
    preferences,
    updatePreferences,
  }
}

// Export for direct access without hook
export { getStoredDisplayPreferences, saveDisplayPreferences }
