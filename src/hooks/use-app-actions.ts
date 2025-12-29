"use client"

import { useState } from "react"
import { toast } from "sonner"
import { parseComicFile, generateCoverImage, SUPPORTED_FORMATS } from "@/lib/comic-parser"
import { saveComic, deleteComic, exportLibrary, importLibrary, clearAllData, savePagesForComic } from "@/lib/storage"
import type { FileWithHandle } from "@/components/library/upload-dialog"
import type { Comic } from "@/lib/types"

export function useAppActions(onDataChange?: () => Promise<void>) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [addComicDialogOpen, setAddComicDialogOpen] = useState(false)
  const [importDataSourceDialogOpen, setImportDataSourceDialogOpen] = useState(false)
  const [listsSheetOpen, setListsSheetOpen] = useState(false)

  async function handleUploadClick() {
    setUploadDialogOpen(true)
  }

  async function handleFilesSelected(filesWithHandles: FileWithHandle[]) {
    if (!filesWithHandles || filesWithHandles.length === 0) return

    const validExtensions = SUPPORTED_FORMATS.extensions
    const validFiles = filesWithHandles.filter(({ file }) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
      return validExtensions.includes(ext)
    })

    if (validFiles.length === 0) {
      toast.error(`Please upload ${SUPPORTED_FORMATS.description} files`)
      return
    }

    const toastId = toast.loading(`Importing ${validFiles.length} comic${validFiles.length > 1 ? "s" : ""}...`)

    let successCount = 0
    let failCount = 0

    for (const { file, handle } of validFiles) {
      try {
        const { pages, metadata } = await parseComicFile(file)
        const coverImage = await generateCoverImage(pages[0])

        const comicId = crypto.randomUUID()

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
        }

        await saveComic(comic)

        if (!handle || metadata.format === "pdf") {
          await savePagesForComic(comicId, pages)
        }

        successCount++
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        failCount++
      }
    }

    await onDataChange?.()

    toast.dismiss(toastId)
    if (successCount > 0) {
      toast.success(
        `${successCount} comic${successCount > 1 ? "s" : ""} imported`,
        failCount > 0 ? { description: `${failCount} failed` } : undefined,
      )
    } else {
      toast.error("Failed to import comics")
    }
  }

  async function handleExport() {
    const toastId = toast.loading("Exporting library...")
    try {
      const blob = await exportLibrary()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `floppy-library-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.dismiss(toastId)
      toast.success("Library exported successfully")
    } catch (error) {
      console.error("Error exporting library:", error)
      toast.dismiss(toastId)
      toast.error("Failed to export library")
    }
  }

  async function handleImport(file: File) {
    const toastId = toast.loading("Importing library...")
    try {
      const result = await importLibrary(file, { merge: true })
      await onDataChange?.()
      toast.dismiss(toastId)
      toast.success("Library imported", {
        description: `${result.comics} comics, ${result.bookmarks} bookmarks, ${result.notes} notes`,
      })
    } catch (error) {
      console.error("Error importing library:", error)
      toast.dismiss(toastId)
      toast.error("Failed to import library", {
        description: error instanceof Error ? error.message : "Invalid file format",
      })
    }
  }

  async function handleClearData() {
    const toastId = toast.loading("Clearing all data...")
    try {
      await clearAllData()
      await onDataChange?.()
      toast.dismiss(toastId)
      toast.success("All data cleared")
    } catch (error) {
      console.error("Error clearing data:", error)
      toast.dismiss(toastId)
      toast.error("Failed to clear data")
    }
  }

  return {
    // Dialog states
    uploadDialogOpen,
    setUploadDialogOpen,
    addComicDialogOpen,
    setAddComicDialogOpen,
    importDataSourceDialogOpen,
    setImportDataSourceDialogOpen,
    listsSheetOpen,
    setListsSheetOpen,

    // Handlers
    handleUploadClick,
    handleFilesSelected,
    handleExport,
    handleImport,
    handleClearData,
  }
}
