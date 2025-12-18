"use client"

import type React from "react"

import { useState } from "react"
import { Upload, File, Folder } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SUPPORTED_FORMATS } from "@/lib/comic-parser"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilesSelected: (files: FileList | null) => void
}

export function UploadDialog({ open, onOpenChange, onFilesSelected }: UploadDialogProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files)
      onOpenChange(false)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files)
      onOpenChange(false)
    }
  }

  const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Comics</DialogTitle>
          <DialogDescription>Upload comic files or select a folder containing comics</DialogDescription>
        </DialogHeader>

        <div
          className={`relative rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Drag and drop comics here</p>
              <p className="mt-1 text-xs text-muted-foreground">or choose from the options below</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
            <label>
              <File className="h-6 w-6" />
              <span className="text-sm font-medium">Select Files</span>
              <span className="text-xs text-muted-foreground">Choose {SUPPORTED_FORMATS.description} files</span>
              <input
                type="file"
                accept={SUPPORTED_FORMATS.accept}
                multiple
                onChange={handleFileInput}
                className="hidden"
                aria-label="Upload comic files"
              />
            </label>
          </Button>

          <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
            <label>
              <Folder className="h-6 w-6" />
              <span className="text-sm font-medium">Select Folder</span>
              <span className="text-xs text-muted-foreground">Import entire folder</span>
              <input
                type="file"
                accept={SUPPORTED_FORMATS.accept}
                multiple
                // @ts-ignore - webkitdirectory is not in the types
                webkitdirectory=""
                // @ts-ignore - directory is not in the types
                directory=""
                onChange={handleFolderInput}
                className="hidden"
                aria-label="Upload comic folder"
              />
            </label>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">Supported formats: {SUPPORTED_FORMATS.description}</p>
      </DialogContent>
    </Dialog>
  )
}
