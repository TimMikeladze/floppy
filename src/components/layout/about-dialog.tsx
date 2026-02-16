"use client";

import { Github } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="sr-only">About floppy</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/40" />
          </div>

          {/* Branding */}
          <div className="text-center">
            <h2 className="text-xl font-semibold">floppy.sh</h2>
            <p className="text-sm text-muted-foreground">
              the open-source comic book app
            </p>
          </div>

          {/* Version */}
          <p className="text-xs text-muted-foreground">Version 0.1.0</p>

          {/* GitHub link */}
          <a
            href="https://github.com/TimMikeladze/floppy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-border/50 hover:bg-accent transition-colors text-sm"
          >
            <Github className="w-4 h-4" />
            View on GitHub
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
