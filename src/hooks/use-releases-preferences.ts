"use client"

import { useCallback, useRef } from "react"

export interface ReleasesPreferences {
  view: "new" | "upcoming" | "calendar" | "pull-list"
}

const STORAGE_KEY = "floppy-releases-preferences"

const defaultPreferences: ReleasesPreferences = {
  view: "new",
}

export function getStoredReleasesPreferences(): ReleasesPreferences {
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
    console.error("Failed to parse releases preferences from localStorage", e)
  }

  return defaultPreferences
}

export function saveReleasesPreferences(preferences: Partial<ReleasesPreferences>): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = getStoredReleasesPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error("Failed to save releases preferences to localStorage", e)
  }
}

export function useReleasesPreferences() {
  const hasInitialized = useRef(false)

  const persistPreferences = useCallback((preferences: Partial<ReleasesPreferences>) => {
    saveReleasesPreferences(preferences)
  }, [])

  return {
    getStoredPreferences: getStoredReleasesPreferences,
    persistPreferences,
    hasInitialized,
  }
}
