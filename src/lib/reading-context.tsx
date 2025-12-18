"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { ReadingSettings } from "./types"

const defaultSettings: Omit<ReadingSettings, "theme"> = {
  pageLayout: "single",
  pageTransition: "slide",
  readingDirection: "ltr",
  fitMode: "fit-width",
  brightness: 100,
  layoutMode: "paged",
}

type ReadingSettingsWithoutTheme = Omit<ReadingSettings, "theme">

const ReadingContext = createContext<{
  settings: ReadingSettingsWithoutTheme
  updateSettings: (settings: Partial<ReadingSettingsWithoutTheme>) => void
}>({
  settings: defaultSettings,
  updateSettings: () => {},
})

export function ReadingProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReadingSettingsWithoutTheme>(defaultSettings)

  useEffect(() => {
    const saved = localStorage.getItem("reading-settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { theme, ...rest } = parsed
        setSettings({ ...defaultSettings, ...rest })
      } catch (error) {
        console.error("Failed to parse reading settings:", error)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<ReadingSettingsWithoutTheme>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      localStorage.setItem("reading-settings", JSON.stringify(updated))
      return updated
    })
  }

  return <ReadingContext.Provider value={{ settings, updateSettings }}>{children}</ReadingContext.Provider>
}

export function useReading() {
  const context = useContext(ReadingContext)
  if (!context) {
    throw new Error("useReading must be used within ReadingProvider")
  }
  return context
}
