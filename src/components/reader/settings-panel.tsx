"use client"

import { useState, useEffect } from "react"
import { useReading } from "@/lib/reading-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Scroll,
  ArrowLeftRight,
  ArrowRightLeft,
  Maximize,
  AlignVerticalJustifyCenter,
  Square,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
} from "lucide-react"

interface SettingsPanelProps {
  variant?: "icon" | "menu"
}

export function SettingsPanel({ variant = "icon" }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const { settings, updateSettings } = useReading()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768)
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  const trigger = variant === "menu" ? (
    <Button variant="ghost" size="sm" className="flex-col gap-1 h-auto py-2 px-3">
      <Settings className="h-5 w-5" />
      <span className="text-xs">Settings</span>
    </Button>
  ) : (
    <Button variant="ghost" size="icon">
      <Settings className="h-5 w-5" />
      <span className="sr-only">Settings</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Layout Mode */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Layout</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={settings.layoutMode === "paged" ? "default" : "outline"}
                  onClick={() => updateSettings({ layoutMode: "paged" })}
                  size="sm"
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Paged
                </Button>
                <Button
                  variant={settings.layoutMode === "scrolling" ? "default" : "outline"}
                  onClick={() => updateSettings({ layoutMode: "scrolling" })}
                  size="sm"
                  className="gap-2"
                >
                  <Scroll className="h-4 w-4" />
                  Scroll
                </Button>
              </div>
            </div>

            {settings.layoutMode === "paged" && (
              <>
                {/* Page Layout */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Pages</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={settings.pageLayout === "single" ? "default" : "outline"}
                      onClick={() => updateSettings({ pageLayout: "single" })}
                      size="sm"
                    >
                      Single
                    </Button>
                    <Button
                      variant={settings.pageLayout === "double" ? "default" : "outline"}
                      onClick={() => updateSettings({ pageLayout: "double" })}
                      size="sm"
                    >
                      Double
                    </Button>
                  </div>
                </div>

                {/* Reading Direction */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Direction</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={settings.readingDirection === "ltr" ? "default" : "outline"}
                      onClick={() => updateSettings({ readingDirection: "ltr" })}
                      size="sm"
                      className="gap-2"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Left → Right
                    </Button>
                    <Button
                      variant={settings.readingDirection === "rtl" ? "default" : "outline"}
                      onClick={() => updateSettings({ readingDirection: "rtl" })}
                      size="sm"
                      className="gap-2"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Right → Left
                    </Button>
                  </div>
                </div>

                {/* Swipe Navigation */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="swipe-navigation" className="text-sm font-medium">
                      Swipe to Turn Pages
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Swipe horizontally to navigate between pages
                    </p>
                  </div>
                  <Switch
                    id="swipe-navigation"
                    checked={settings.swipeToTurnPages ?? true}
                    onCheckedChange={(checked) => updateSettings({ swipeToTurnPages: checked })}
                  />
                </div>

                {/* Hide Navigation Arrows */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hide-nav-arrows" className="text-sm font-medium">
                      Hide Navigation Arrows
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Hide the left/right arrows on screen
                    </p>
                  </div>
                  <Switch
                    id="hide-nav-arrows"
                    checked={settings.hideNavigationArrows ?? true}
                    onCheckedChange={(checked) => updateSettings({ hideNavigationArrows: checked })}
                  />
                </div>
              </>
            )}

            {/* Theme */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Theme</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={mounted && theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  size="sm"
                  className="gap-2"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={mounted && theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  size="sm"
                  className="gap-2"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={mounted && theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  size="sm"
                  className="gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Auto
                </Button>
              </div>
            </div>

            {/* Brightness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Brightness</h3>
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

            {/* Fit Mode */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Fit Mode</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={settings.fitMode === "fit-width" ? "default" : "outline"}
                  onClick={() => updateSettings({ fitMode: "fit-width" })}
                  size="sm"
                  className="gap-2"
                >
                  <Maximize className="h-4 w-4" />
                  Width
                </Button>
                <Button
                  variant={settings.fitMode === "fit-height" ? "default" : "outline"}
                  onClick={() => updateSettings({ fitMode: "fit-height" })}
                  size="sm"
                  className="gap-2"
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                  Height
                </Button>
                <Button
                  variant={settings.fitMode === "original" ? "default" : "outline"}
                  onClick={() => updateSettings({ fitMode: "original" })}
                  size="sm"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Original
                </Button>
              </div>
            </div>

            {/* Page Numbers */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-page-numbers" className="text-sm font-medium">
                Show Page Numbers
              </Label>
              <Switch
                id="show-page-numbers"
                checked={settings.showPageNumbers ?? false}
                onCheckedChange={(checked) => updateSettings({ showPageNumbers: checked })}
              />
            </div>

            {/* Toolbar Position (desktop only) */}
            {isDesktop && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Menu Position</h3>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={settings.toolbarPosition === "left" ? "default" : "outline"}
                    onClick={() => updateSettings({ toolbarPosition: "left" })}
                    size="sm"
                    className="gap-1"
                  >
                    <PanelLeft className="h-4 w-4" />
                    Left
                  </Button>
                  <Button
                    variant={settings.toolbarPosition === "right" ? "default" : "outline"}
                    onClick={() => updateSettings({ toolbarPosition: "right" })}
                    size="sm"
                    className="gap-1"
                  >
                    <PanelRight className="h-4 w-4" />
                    Right
                  </Button>
                  <Button
                    variant={settings.toolbarPosition === "top" ? "default" : "outline"}
                    onClick={() => updateSettings({ toolbarPosition: "top" })}
                    size="sm"
                    className="gap-1"
                  >
                    <PanelTop className="h-4 w-4" />
                    Top
                  </Button>
                  <Button
                    variant={settings.toolbarPosition === "bottom" ? "default" : "outline"}
                    onClick={() => updateSettings({ toolbarPosition: "bottom" })}
                    size="sm"
                    className="gap-1"
                  >
                    <PanelBottom className="h-4 w-4" />
                    Bottom
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
