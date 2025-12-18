"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { parseComicFile, generateCoverImage, SUPPORTED_FORMATS } from "@/lib/comic-parser"
import { getComic, saveComic, savePage } from "@/lib/storage"
import { Upload, FileCheck } from "lucide-react"
import { toast } from "sonner"

interface AttachFileDialogProps {
  comicId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileAttached: () => void
}

export function AttachFileDialog({ comicId, open, onOpenChange, onFileAttached }: AttachFileDialogProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { pages, metadata, pdfData } = await parseComicFile(file)
      const comic = await getComic(comicId)

      if (!comic) {
        throw new Error("Comic not found")
      }

      // Generate cover from first page
      const coverImage = await generateCoverImage(pages[0])

      // Update comic with file data
      const updatedComic = {
        ...comic,
        coverImage,
        totalPages: metadata.totalPages,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        hasFile: true,
        format: metadata.format,
        pdfRenderMode: pdfData ? "native" as const : undefined,
      }

      await saveComic(updatedComic)

      // Save pages
      if (pdfData) {
        // Native PDF mode - store raw PDF data
        await savePage(comicId, -1, new Blob([pdfData], { type: "application/pdf" }))
        await savePage(comicId, 0, pages[0])
      } else {
        // Image-based mode - save all pages
        for (let i = 0; i < pages.length; i++) {
          await savePage(comicId, i, pages[i])
        }
      }

      toast.success("File attached", {
        description: `${metadata.totalPages} pages loaded successfully`,
      })

      onFileAttached()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error attaching file:", error)
      toast.error(error instanceof Error ? error.message : "Failed to attach file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Attach Comic File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Upload a {SUPPORTED_FORMATS.description} file to make this comic readable</p>

          <div className="flex flex-col gap-3">
            <label htmlFor="attach-file">
              <input
                id="attach-file"
                type="file"
                accept={SUPPORTED_FORMATS.accept}
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <Button asChild disabled={uploading} className="w-full gap-2">
                <span>
                  {uploading ? (
                    <>
                      <FileCheck className="h-4 w-4 animate-pulse" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select File
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
