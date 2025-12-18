"use client";

import { Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppSettings } from "@/hooks/use-app-settings";

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreferencesDialog({
  open,
  onOpenChange,
}: PreferencesDialogProps) {
  const { settings, updateSettings, mounted } = useAppSettings();

  if (!mounted) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Preferences
          </DialogTitle>
          <DialogDescription>Customize your app experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Dialog Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              Upload Dialog
            </h4>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="show-comic-sources"
                  className="text-sm font-medium"
                >
                  Show free comic sources
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display links to free legal comic download sites
                </p>
              </div>
              <Switch
                id="show-comic-sources"
                checked={settings.showComicSources}
                onCheckedChange={(checked) =>
                  updateSettings({ showComicSources: checked })
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
