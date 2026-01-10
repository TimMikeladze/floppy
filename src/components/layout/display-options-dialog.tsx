"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useDisplayPreferences, type GridDensity } from "@/hooks/use-display-preferences"
import { Grid3X3, LayoutGrid, Grid2X2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisplayOptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const densityOptions: { value: GridDensity; label: string; icon: typeof Grid3X3; description: string }[] = [
  { value: "compact", label: "Compact", icon: Grid3X3, description: "More comics per row" },
  { value: "comfortable", label: "Comfortable", icon: LayoutGrid, description: "Default size" },
  { value: "spacious", label: "Spacious", icon: Grid2X2, description: "Larger covers" },
]

export function DisplayOptionsDialog({ open, onOpenChange }: DisplayOptionsDialogProps) {
  const { preferences, updatePreferences } = useDisplayPreferences()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Display Options</DialogTitle>
          <DialogDescription>
            Customize how your comic library is displayed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Grid Density */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Grid Density</Label>
            <div className="grid grid-cols-3 gap-2">
              {densityOptions.map((option) => {
                const Icon = option.icon
                const isSelected = preferences.gridDensity === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => updatePreferences({ gridDensity: option.value })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-accent"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-xs font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {densityOptions.find(o => o.value === preferences.gridDensity)?.description}
            </p>
          </div>

          {/* Show Names Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-names" className="text-sm font-medium">
                Show Names
              </Label>
              <p className="text-xs text-muted-foreground">
                Display comic titles below covers
              </p>
            </div>
            <Switch
              id="show-names"
              checked={preferences.showNames}
              onCheckedChange={(checked) => updatePreferences({ showNames: checked })}
            />
          </div>

          {/* Show Page Numbers Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-page-numbers" className="text-sm font-medium">
                Show Page Numbers
              </Label>
              <p className="text-xs text-muted-foreground">
                Display page count and reading progress
              </p>
            </div>
            <Switch
              id="show-page-numbers"
              checked={preferences.showPageNumbers}
              onCheckedChange={(checked) => updatePreferences({ showPageNumbers: checked })}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
