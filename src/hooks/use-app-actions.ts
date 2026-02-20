"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { FileWithHandle } from "@/components/library/upload-dialog";
import {
  detectFormat,
  generateCoverImage,
  generateThumbnail,
  parseComicFile,
  parseEpubMetadata,
  SUPPORTED_FORMATS,
} from "@/lib/comic-parser";
import {
  clearAllData,
  exportLibrary,
  importLibrary,
  saveComic,
  saveEpubFile,
  savePagesForComic,
} from "@/lib/storage";
import type { Comic } from "@/lib/types";

export function useAppActions(onDataChange?: () => Promise<void>) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [addComicDialogOpen, setAddComicDialogOpen] = useState(false);
  const [importDataSourceDialogOpen, setImportDataSourceDialogOpen] =
    useState(false);
  const [listsSheetOpen, setListsSheetOpen] = useState(false);

  async function handleUploadClick() {
    setUploadDialogOpen(true);
  }

  async function handleFilesSelected(filesWithHandles: FileWithHandle[]) {
    if (!filesWithHandles || filesWithHandles.length === 0) return;

    const validExtensions = SUPPORTED_FORMATS.extensions;
    const validFiles = filesWithHandles.filter(({ file }) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      return validExtensions.includes(ext);
    });

    if (validFiles.length === 0) {
      toast.error(`Please upload ${SUPPORTED_FORMATS.description} files`);
      return;
    }

    const total = validFiles.length;
    let completed = 0;
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Importing comics: 0/${total} complete`);

    const updateProgress = () => {
      toast.loading(`Importing comics: ${completed}/${total} complete`, {
        id: toastId,
      });
    };

    async function processFile({
      file,
      handle,
    }: FileWithHandle): Promise<boolean> {
      try {
        const format = detectFormat(file);
        const comicId = crypto.randomUUID();

        // EPUB: fast metadata-only import, store raw file for epubjs
        if (format === "epub") {
          const epubMeta = await parseEpubMetadata(file);
          let coverImage = "";
          if (epubMeta.coverBlob) {
            coverImage = await generateThumbnail(epubMeta.coverBlob);
          }

          const comic: Comic = {
            id: comicId,
            title: epubMeta.title,
            coverImage,
            totalPages: epubMeta.chapterCount,
            currentPage: 0,
            fileName: epubMeta.fileName,
            fileSize: epubMeta.fileSize,
            hasFile: true,
            format: "epub",
            author: epubMeta.author,
            publisher: epubMeta.publisher,
            fileHandle: handle,
            sourceType: "local",
            addedAt: new Date(),
          };

          await saveComic(comic);
          await saveEpubFile(comicId, file);
          return true;
        }

        // Non-EPUB: existing rasterize flow
        const { pages, metadata } = await parseComicFile(file);
        const coverImage = await generateCoverImage(pages[0]);

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
          sourceType: "local",
          addedAt: new Date(),
        };

        await saveComic(comic);

        if (!handle || metadata.format === "pdf") {
          await savePagesForComic(comicId, pages);
        }

        return true;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        return false;
      }
    }

    // Process files sequentially for reliability (prevents browser crashes)
    for (const fileWithHandle of validFiles) {
      const success = await processFile(fileWithHandle);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      completed++;
      updateProgress();

      // Small delay between files to allow browser to garbage collect
      if (completed < total) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await onDataChange?.();

    toast.dismiss(toastId);
    if (successCount > 0) {
      toast.success(
        `${successCount} comic${successCount > 1 ? "s" : ""} imported`,
        failCount > 0 ? { description: `${failCount} failed` } : undefined,
      );
    } else {
      toast.error("Failed to import comics");
    }
  }

  async function handleExport() {
    const toastId = toast.loading("Exporting library...");
    try {
      const blob = await exportLibrary();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `floppy-library-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success("Library exported successfully");
    } catch (error) {
      console.error("Error exporting library:", error);
      toast.dismiss(toastId);
      toast.error("Failed to export library");
    }
  }

  async function handleImport(file: File) {
    const toastId = toast.loading("Importing library...");
    try {
      const result = await importLibrary(file, { merge: true });
      await onDataChange?.();
      toast.dismiss(toastId);
      toast.success("Library imported", {
        description: `${result.comics} comics, ${result.bookmarks} bookmarks, ${result.notes} notes`,
      });
    } catch (error) {
      console.error("Error importing library:", error);
      toast.dismiss(toastId);
      toast.error("Failed to import library", {
        description:
          error instanceof Error ? error.message : "Invalid file format",
      });
    }
  }

  async function handleClearData() {
    const toastId = toast.loading("Clearing all data...");
    try {
      await clearAllData();
      await onDataChange?.();
      toast.dismiss(toastId);
      toast.success("All data cleared");
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.dismiss(toastId);
      toast.error("Failed to clear data");
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
  };
}
