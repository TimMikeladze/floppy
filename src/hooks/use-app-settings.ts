"use client"

import { useState, useEffect, useCallback } from "react"

export interface AppSettings {
  /** Show free comic sources in upload dialog */
  showComicSources: boolean
}

const STORAGE_KEY = "floppy-app-settings"

const defaultSettings: AppSettings = {
  showComicSources: true,
}

export function getStoredAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...defaultSettings,
        ...parsed,
      }
    }
  } catch (e) {
    console.error("Failed to parse app settings from localStorage", e)
  }

  return defaultSettings
}

export function saveAppSettings(settings: Partial<AppSettings>): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = getStoredAppSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error("Failed to save app settings to localStorage", e)
  }
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setSettings(getStoredAppSettings())
    setMounted(true)
  }, [])

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      saveAppSettings(updated)
      return updated
    })
  }, [])

  return {
    settings,
    updateSettings,
    mounted,
  }
}
