"use client"

import { useState, useCallback, useEffect } from "react"
import { X, Check, AlertCircle, Loader2, Pause, Play, FileArchive, Copy, SkipForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { parseComicFile, generateCoverImage, SUPPORTED_FORMATS } from "@/lib/comic-parser"
import { saveComic, savePagesForComic, getAllComics } from "@/lib/storage"
import { parseComicTitle } from "@/lib/series-utils"
import { findDuplicates, type DuplicateMatch } from "@/lib/duplicate-detection"
import type { FileWithHandle } from "./upload-dialog"
import type { Comic } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FileStatus {
  file: File
  handle?: FileSystemFileHandle
  status: 'pending' | 'processing' | 'success' | 'error' | 'skipped' | 'duplicate'
  error?: string
  progress?: number
  parsedTitle?: {
    seriesName: string
    issueNumber: number | null
  }
  duplicateMatch?: DuplicateMatch
}

interface BatchUploadManagerProps {
  files: FileWithHandle[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function BatchUploadManager({ files, open, onOpenChange, onComplete }: BatchUploadManagerProps) {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>(() =>
    files.map(({ file, handle }) => {
      const parsed = parseComicTitle(file.name)
      return {
        file,
        handle,
        status: 'pending' as const,
        parsedTitle: parsed,
      }
    })
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(true)

  // Check for duplicates on mount
  useEffect(() => {
    async function checkDuplicates() {
      setIsCheckingDuplicates(true)
      try {
        const existingComics = await getAllComics()

        setFileStatuses(prev => prev.map(fileStatus => {
          const matches = findDuplicates(fileStatus.file, existingComics)
          if (matches.length > 0 && matches[0].confidence > 0.8) {
            return {
              ...fileStatus,
              status: 'duplicate' as const,
              duplicateMatch: matches[0],
            }
          }
          return fileStatus
        }))
      } catch (error) {
        console.error('Error checking duplicates:', error)
      } finally {
        setIsCheckingDuplicates(false)
      }
    }

    checkDuplicates()
  }, [])

  const completedCount = fileStatuses.filter(f => f.status === 'success').length
  const errorCount = fileStatuses.filter(f => f.status === 'error').length
  const skippedCount = fileStatuses.filter(f => f.status === 'skipped').length
  const duplicateCount = fileStatuses.filter(f => f.status === 'duplicate').length
  const totalCount = fileStatuses.length
  const processedCount = completedCount + errorCount + skippedCount
  const progress = totalCount > 0 ? processedCount / totalCount * 100 : 0

  const processFile = useCallback(async (fileStatus: FileStatus, index: number) => {
    const { file, handle } = fileStatus

    setFileStatuses(prev => prev.map((f, i) =>
      i === index ? { ...f, status: 'processing' as const, progress: 0 } : f
    ))

    try {
      const { pages, metadata } = await parseComicFile(file)

      setFileStatuses(prev => prev.map((f, i) =>
        i === index ? { ...f, progress: 50 } : f
      ))

      const coverImage = await generateCoverImage(pages[0])

      setFileStatuses(prev => prev.map((f, i) =>
        i === index ? { ...f, progress: 75 } : f
      ))

      const comicId = crypto.randomUUID()
      const parsed = parseComicTitle(metadata.title)

      const comic: Comic = {
        id: comicId,
        title: metadata.title,
        coverImage,
        totalPages: metadata.totalPages,
        currentPage: 0,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        hasFile: true,
        format: metadata.format,
        fileHandle: handle,
        sourceType: 'local',
        series: parsed.seriesName,
        issue: parsed.issueNumber?.toString(),
      }

      await saveComic(comic)

      if (!handle || metadata.format === "pdf") {
        await savePagesForComic(comicId, pages)
      }

      setFileStatuses(prev => prev.map((f, i) =>
        i === index ? { ...f, status: 'success' as const, progress: 100 } : f
      ))

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setFileStatuses(prev => prev.map((f, i) =>
        i === index ? { ...f, status: 'error' as const, error: errorMessage } : f
      ))
      return false
    }
  }, [])

  const skipDuplicate = useCallback((index: number) => {
    setFileStatuses(prev => prev.map((f, i) =>
      i === index ? { ...f, status: 'skipped' as const } : f
    ))
  }, [])

  const importAnyway = useCallback((index: number) => {
    setFileStatuses(prev => prev.map((f, i) =>
      i === index ? { ...f, status: 'pending' as const, duplicateMatch: undefined } : f
    ))
  }, [])

  const startProcessing = useCallback(async () => {
    setIsProcessing(true)
    setIsPaused(false)

    for (let i = currentIndex; i < fileStatuses.length; i++) {
      if (isPaused) {
        setCurrentIndex(i)
        return
      }

      const fileStatus = fileStatuses[i]
      if (fileStatus.status === 'pending') {
        await processFile(fileStatus, i)
        // Small delay to prevent browser from freezing
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    setIsProcessing(false)
    setCurrentIndex(0)
  }, [currentIndex, fileStatuses, isPaused, processFile])

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      startProcessing()
    } else {
      setIsPaused(true)
    }
  }

  const handleClose = () => {
    if (completedCount > 0) {
      onComplete()
    }
    onOpenChange(false)
  }

  const handleStart = () => {
    startProcessing()
  }

  const pendingCount = fileStatuses.filter(f => f.status === 'pending').length
  const allComplete = (completedCount + errorCount + skippedCount === totalCount - duplicateCount) &&
                      duplicateCount === 0 &&
                      totalCount > 0
  const hasUnresolvedDuplicates = duplicateCount > 0 && !isProcessing

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85vh] sm:max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <span className="text-base sm:text-lg">
              {isCheckingDuplicates
                ? `Checking for duplicates...`
                : allComplete
                  ? `Import Complete`
                  : hasUnresolvedDuplicates
                    ? `${duplicateCount} Potential Duplicate${duplicateCount > 1 ? 's' : ''}`
                    : isProcessing
                      ? `Importing Comics...`
                      : `Import ${totalCount} Comics`
              }
            </span>
            {allComplete && (
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                {completedCount} succeeded
                {errorCount > 0 && `, ${errorCount} failed`}
                {skippedCount > 0 && `, ${skippedCount} skipped`}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progress bar */}
        <div className="px-4 sm:px-6 py-2 sm:py-3 border-b bg-secondary/30">
          <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
            <span className="text-muted-foreground">
              {completedCount + errorCount} / {totalCount}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>

        {/* File list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-3 sm:px-6 py-2 sm:py-3 space-y-1.5 sm:space-y-2">
            {fileStatuses.map((fileStatus, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-colors",
                  fileStatus.status === 'success' && "bg-green-500/5 border-green-500/20",
                  fileStatus.status === 'error' && "bg-red-500/5 border-red-500/20",
                  fileStatus.status === 'processing' && "bg-primary/5 border-primary/20",
                  fileStatus.status === 'pending' && "bg-secondary/50 border-border/50",
                  fileStatus.status === 'duplicate' && "bg-amber-500/5 border-amber-500/20",
                  fileStatus.status === 'skipped' && "bg-muted/50 border-border/30 opacity-60"
                )}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {fileStatus.status === 'success' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    </div>
                  )}
                  {fileStatus.status === 'error' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                    </div>
                  )}
                  {fileStatus.status === 'processing' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-spin" />
                    </div>
                  )}
                  {fileStatus.status === 'pending' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-secondary flex items-center justify-center">
                      <FileArchive className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                  )}
                  {fileStatus.status === 'duplicate' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                    </div>
                  )}
                  {fileStatus.status === 'skipped' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center">
                      <SkipForward className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {fileStatus.parsedTitle?.seriesName || fileStatus.file.name}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {fileStatus.parsedTitle?.issueNumber && `#${fileStatus.parsedTitle.issueNumber} · `}
                    {(fileStatus.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  {fileStatus.error && (
                    <p className="text-[10px] sm:text-xs text-red-500 mt-0.5 sm:mt-1 line-clamp-1">{fileStatus.error}</p>
                  )}
                  {fileStatus.status === 'duplicate' && fileStatus.duplicateMatch && (
                    <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5 sm:mt-1 line-clamp-1">
                      Matches: {fileStatus.duplicateMatch.existingComic.title}
                      {' '}({Math.round(fileStatus.duplicateMatch.confidence * 100)}%)
                    </p>
                  )}
                  {fileStatus.status === 'skipped' && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Skipped</p>
                  )}
                </div>

                {/* Progress for processing items */}
                {fileStatus.status === 'processing' && fileStatus.progress !== undefined && (
                  <div className="flex-shrink-0 w-8 sm:w-12 text-[10px] sm:text-xs text-muted-foreground text-right">
                    {fileStatus.progress}%
                  </div>
                )}

                {/* Duplicate action buttons */}
                {fileStatus.status === 'duplicate' && !isProcessing && (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => skipDuplicate(index)}
                      className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                    >
                      Skip
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => importAnyway(index)}
                      className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3"
                    >
                      Import
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-background flex items-center justify-between gap-2 sm:gap-3">
          {!isProcessing && !allComplete && (
            <>
              <Button variant="outline" onClick={handleClose} className="text-sm sm:text-base">
                Cancel
              </Button>
              <Button onClick={handleStart} className="gap-1.5 sm:gap-2 text-sm sm:text-base">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Start Import
              </Button>
            </>
          )}

          {isProcessing && !allComplete && (
            <>
              <Button variant="outline" onClick={handlePauseResume} className="gap-1.5 sm:gap-2 text-sm sm:text-base">
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Pause
                  </>
                )}
              </Button>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Processing...
              </div>
            </>
          )}

          {allComplete && (
            <Button onClick={handleClose} className="ml-auto text-sm sm:text-base">
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
