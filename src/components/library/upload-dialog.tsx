"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { Upload, Sparkles } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { SUPPORTED_FORMATS } from "@/lib/comic-parser"
import { isFileSystemAccessSupported } from "@/lib/storage"
import { FreeComicsSources } from "@/components/free-comics-sources"
import { useAppSettings } from "@/hooks/use-app-settings"

export interface FileWithHandle {
  file: File
  handle?: FileSystemFileHandle
}

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilesSelected: (files: FileWithHandle[]) => void
}

// iOS-friendly accept string - include common MIME types that iOS recognizes
// Using * as fallback since iOS may not show .cbz/.cbr files with strict accept
const IOS_FRIENDLY_ACCEPT = ".cbz,.zip,.cbr,.rar,.pdf,application/zip,application/x-zip-compressed,application/pdf,application/x-rar-compressed,*/*"

export function UploadDialog({ open, onOpenChange, onFilesSelected }: UploadDialogProps) {
  const [dragActive, setDragActive] = useState(false)
  const supportsFileSystem = typeof window !== "undefined" && isFileSystemAccessSupported()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { settings } = useAppSettings()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesWithHandles: FileWithHandle[] = Array.from(e.dataTransfer.files).map((file) => ({ file }))
      onFilesSelected(filesWithHandles)
      onOpenChange(false)
    }
  }, [onFilesSelected, onOpenChange])

  const handleFolderInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesWithHandles: FileWithHandle[] = Array.from(e.target.files).map((file) => ({ file }))
      onFilesSelected(filesWithHandles)
      onOpenChange(false)
    }
  }, [onFilesSelected, onOpenChange])

  const handleFilePicker = useCallback(async () => {
    // Use File System Access API on supported browsers (mainly desktop Chrome/Edge)
    if (supportsFileSystem) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: "Comic files",
              accept: {
                "application/zip": [".cbz", ".zip"],
                "application/x-rar-compressed": [".cbr", ".rar"],
                "application/pdf": [".pdf"],
              },
            },
          ],
        })

        const filesWithHandles: FileWithHandle[] = await Promise.all(
          handles.map(async (handle) => ({
            file: await handle.getFile(),
            handle,
          }))
        )

        onFilesSelected(filesWithHandles)
        onOpenChange(false)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error picking files:", error)
        }
      }
    } else {
      // Fallback for iOS/Safari/Firefox - trigger hidden file input
      fileInputRef.current?.click()
    }
  }, [supportsFileSystem, onFilesSelected, onOpenChange])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesWithHandles: FileWithHandle[] = Array.from(e.target.files).map((file) => ({ file }))
      onFilesSelected(filesWithHandles)
      onOpenChange(false)
    }
  }, [onFilesSelected, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0 bg-transparent shadow-none">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'var(--card)',
            boxShadow: '0 25px 50px -12px oklch(0 0 0 / 0.4), 0 0 0 1px var(--border)',
          }}
        >
          {/* Hidden file input for iOS/Safari fallback */}
          <input
            ref={fileInputRef}
            type="file"
            accept={IOS_FRIENDLY_ACCEPT}
            multiple
            onChange={handleFileInput}
            className="hidden"
            aria-label="Select comic files"
          />

          {/* Main drop zone */}
          <div
            className="relative cursor-pointer transition-all duration-300"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleFilePicker}
            style={{
              background: dragActive
                ? 'linear-gradient(135deg, oklch(0.78 0.12 70 / 0.15) 0%, oklch(0.78 0.12 70 / 0.05) 100%)'
                : 'transparent',
            }}
          >
            {/* Decorative gradient orb */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle, oklch(0.78 0.12 70 / 0.2) 0%, transparent 70%)',
                opacity: dragActive ? 1 : 0.3,
                filter: 'blur(40px)',
              }}
            />

            <div className="relative px-8 pt-12 pb-8">
              {/* Icon container */}
              <div
                className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  dragActive ? 'scale-110' : ''
                }`}
                style={{
                  background: dragActive
                    ? 'linear-gradient(135deg, var(--primary) 0%, oklch(0.68 0.15 70) 100%)'
                    : 'var(--secondary)',
                  boxShadow: dragActive
                    ? '0 20px 40px oklch(0.78 0.12 70 / 0.4), 0 0 0 1px oklch(0.85 0.1 70 / 0.3) inset'
                    : '0 4px 12px oklch(0 0 0 / 0.1), 0 0 0 1px var(--border)',
                }}
              >
                {dragActive ? (
                  <Sparkles
                    className="w-9 h-9 transition-colors duration-300"
                    style={{ color: 'var(--primary-foreground)' }}
                  />
                ) : (
                  <Upload
                    className="w-9 h-9 transition-colors duration-300"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                )}
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <h3
                  className="text-xl font-semibold tracking-tight transition-colors duration-300"
                  style={{ color: dragActive ? 'var(--primary)' : 'var(--foreground)' }}
                >
                  {dragActive ? 'Drop to import' : 'Add comics'}
                </h3>
                <p
                  className="text-sm transition-colors duration-300"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {dragActive
                    ? 'Release to start importing'
                    : 'Drop files here or click to browse'
                  }
                </p>
              </div>
            </div>

            {/* Animated border on drag */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
              style={{
                opacity: dragActive ? 1 : 0,
                border: '2px dashed var(--primary)',
              }}
            />
          </div>

          {/* Divider */}
          <div className="px-6">
            <div
              className="h-px w-full"
              style={{ background: 'var(--border)' }}
            />
          </div>

          {/* Bottom options */}
          <div className="p-4 flex gap-3">
            {/* Folder option */}
            <label
              className="flex-1 group cursor-pointer"
            >
              <div
                className="px-4 py-3 rounded-xl text-center transition-all duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]"
                style={{
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Import folder
                </span>
              </div>
              <input
                type="file"
                accept={IOS_FRIENDLY_ACCEPT}
                multiple
                // @ts-ignore
                webkitdirectory=""
                // @ts-ignore
                directory=""
                onChange={handleFolderInput}
                className="hidden"
                aria-label="Import folder"
              />
            </label>

            {/* Select files button - always show on mobile/iOS for better UX */}
            <label className="flex-1 group cursor-pointer">
              <div
                className="px-4 py-3 rounded-xl text-center transition-all duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]"
                style={{
                  background: 'var(--primary)',
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: 'var(--primary-foreground)' }}
                >
                  Select files
                </span>
              </div>
              <input
                type="file"
                accept={IOS_FRIENDLY_ACCEPT}
                multiple
                onChange={handleFileInput}
                className="hidden"
                aria-label="Select files"
              />
            </label>
          </div>

          {/* Format hint */}
          <div className="px-4 pb-4">
            <p
              className="text-xs text-center"
              style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}
            >
              {SUPPORTED_FORMATS.description}
            </p>
          </div>

          {/* Free comics sources */}
          {settings.showComicSources && (
            <div className="px-4 pb-4">
              <div
                className="h-px w-full mb-4"
                style={{ background: 'var(--border)' }}
              />
              <FreeComicsSources variant="compact" maxSources={6} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
