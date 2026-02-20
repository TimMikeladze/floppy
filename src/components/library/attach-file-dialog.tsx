"use client";

import { FileCheck, Upload } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  generateCoverImage,
  parseComicFile,
  SUPPORTED_FORMATS,
} from "@/lib/comic-parser";
import {
  getComic,
  isFileSystemAccessSupported,
  saveComic,
  savePagesForComic,
} from "@/lib/storage";

interface AttachFileDialogProps {
  comicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileAttached: () => void;
}

export function AttachFileDialog({
  comicId,
  open,
  onOpenChange,
  onFileAttached,
}: AttachFileDialogProps) {
  const [uploading, setUploading] = useState(false);
  const supportsFileSystem =
    typeof window !== "undefined" && isFileSystemAccessSupported();

  async function processFile(file: File, handle?: FileSystemFileHandle) {
    setUploading(true);
    try {
      const { pages, metadata } = await parseComicFile(file);
      const comic = await getComic(comicId);

      if (!comic) {
        throw new Error("Comic not found");
      }

      const coverImage = await generateCoverImage(pages[0]);

      const updatedComic = {
        ...comic,
        coverImage,
        totalPages: metadata.totalPages,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        hasFile: true,
        format: metadata.format,
        fileHandle: handle,
      };

      await saveComic(updatedComic);

      // Store pages in IndexedDB for:
      // 1. iOS/Safari where File System Access API is unavailable (no handle)
      // 2. PDF files - since they're already rendered to images at import time,
      //    storing them avoids re-parsing on every view
      if (!handle || metadata.format === "pdf") {
        await savePagesForComic(comicId, pages);
      }

      toast.success("File attached", {
        description: `${metadata.totalPages} pages loaded successfully`,
      });

      onFileAttached();
      onOpenChange(false);
    } catch (error) {
      console.error("[v0] Error attaching file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to attach file",
      );
    } finally {
      setUploading(false);
    }
  }

  // Use File System Access API when available for file handles
  async function handleFilePicker() {
    if (!supportsFileSystem) return;

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Comic files",
            accept: {
              "application/zip": [".cbz", ".zip"],
              "application/x-rar-compressed": [".cbr", ".rar"],
              "application/pdf": [".pdf"],
              "application/epub+zip": [".epub"],
            },
          },
        ],
      });

      const file = await handle.getFile();
      await processFile(file, handle);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Error picking file:", error);
        toast.error("Failed to select file");
      }
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Attach Comic File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a {SUPPORTED_FORMATS.description} file to make this comic
            readable
          </p>

          <div className="flex flex-col gap-3">
            {supportsFileSystem ? (
              <Button
                onClick={handleFilePicker}
                disabled={uploading}
                className="w-full gap-2"
              >
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
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
