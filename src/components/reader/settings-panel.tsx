"use client"

import { useReading } from "@/lib/reading-context"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Zap, Wind, Gauge, BookOpen, Scroll } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const { settings, updateSettings } = useReading()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Reading Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={mounted && theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className="gap-2"
                size="sm"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={mounted && theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className="gap-2"
                size="sm"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={mounted && theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
                className="gap-2"
                size="sm"
              >
                <Monitor className="h-4 w-4" />
                Auto
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Layout Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={settings.layoutMode === "paged" ? "default" : "outline"}
                onClick={() => updateSettings({ layoutMode: "paged" })}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Paged
              </Button>
              <Button
                variant={settings.layoutMode === "scrolling" ? "default" : "outline"}
                onClick={() => updateSettings({ layoutMode: "scrolling" })}
                className="gap-2"
              >
                <Scroll className="h-4 w-4" />
                Scrolling
              </Button>
            </div>
          </div>

          {settings.layoutMode === "paged" && (
            <div className="space-y-3">
              <Label>Page Layout</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={settings.pageLayout === "single" ? "default" : "outline"}
                  onClick={() => updateSettings({ pageLayout: "single" })}
                >
                  Single Page
                </Button>
                <Button
                  variant={settings.pageLayout === "double" ? "default" : "outline"}
                  onClick={() => updateSettings({ pageLayout: "double" })}
                >
                  Double Page
                </Button>
              </div>
            </div>
          )}

          {settings.layoutMode === "paged" && (
            <div className="space-y-3">
              <Label>Reading Direction</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={settings.readingDirection === "ltr" ? "default" : "outline"}
                  onClick={() => updateSettings({ readingDirection: "ltr" })}
                >
                  Left to Right
                </Button>
                <Button
                  variant={settings.readingDirection === "rtl" ? "default" : "outline"}
                  onClick={() => updateSettings({ readingDirection: "rtl" })}
                >
                  Right to Left
                </Button>
              </div>
            </div>
          )}

          {settings.layoutMode === "paged" && (
            <div className="space-y-3">
              <Label>Page Transition</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={settings.pageTransition === "slide" ? "default" : "outline"}
                  onClick={() => updateSettings({ pageTransition: "slide" })}
                  className="gap-1.5"
                  size="sm"
                >
                  <Wind className="h-3.5 w-3.5" />
                  Slide
                </Button>
                <Button
                  variant={settings.pageTransition === "fade" ? "default" : "outline"}
                  onClick={() => updateSettings({ pageTransition: "fade" })}
                  className="gap-1.5"
                  size="sm"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Fade
                </Button>
                <Button
                  variant={settings.pageTransition === "instant" ? "default" : "outline"}
                  onClick={() => updateSettings({ pageTransition: "instant" })}
                  className="gap-1.5"
                  size="sm"
                >
                  <Gauge className="h-3.5 w-3.5" />
                  Instant
                </Button>
              </div>
            </div>
          )}

          {/* Fit Mode */}
          <div className="space-y-3">
            <Label>Fit Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={settings.fitMode === "fit-width" ? "default" : "outline"}
                onClick={() => updateSettings({ fitMode: "fit-width" })}
                size="sm"
              >
                Width
              </Button>
              <Button
                variant={settings.fitMode === "fit-height" ? "default" : "outline"}
                onClick={() => updateSettings({ fitMode: "fit-height" })}
                size="sm"
              >
                Height
              </Button>
              <Button
                variant={settings.fitMode === "original" ? "default" : "outline"}
                onClick={() => updateSettings({ fitMode: "original" })}
                size="sm"
              >
                Original
              </Button>
            </div>
          </div>

          {/* Brightness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Brightness</Label>
              <span className="text-sm text-muted-foreground">{settings.brightness}%</span>
            </div>
            <Slider
              value={[settings.brightness]}
              min={30}
              max={150}
              step={5}
              onValueChange={([value]) => updateSettings({ brightness: value })}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
