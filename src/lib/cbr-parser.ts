import { Archive } from "libarchive.js";
import type { ComicFormat } from "./types";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

// Track if Archive has been initialized
let archiveInitialized = false;

async function initArchive() {
  if (archiveInitialized) return;

  // Initialize Archive with local worker URL
  Archive.init({
    workerUrl: "/libarchive-worker.js",
  });
  archiveInitialized = true;
}

export interface ParseResult {
  pages: Blob[];
  metadata: {
    title: string;
    totalPages: number;
    fileName: string;
    fileSize: number;
    format: ComicFormat;
  };
}

export interface CbrParseOptions {
  /** Progress callback - receives current file and total files */
  onProgress?: (current: number, total: number) => void;
  /** Abort signal for cancellation support */
  signal?: AbortSignal;
}

/**
 * Parse CBR/RAR files with progress reporting
 */
export async function parseCbrFile(
  file: File,
  options: CbrParseOptions = {},
): Promise<ParseResult> {
  const { onProgress, signal } = options;

  // Check for cancellation
  if (signal?.aborted) {
    throw new DOMException("Parsing was cancelled", "AbortError");
  }

  await initArchive();

  const archive = await Archive.open(file);

  // Check for cancellation after opening
  if (signal?.aborted) {
    throw new DOMException("Parsing was cancelled", "AbortError");
  }

  const extractedFiles = await archive.getFilesArray();

  // Filter and sort image files
  const imageFiles = extractedFiles
    .filter((entry) => {
      const name = entry.file.name.toLowerCase();
      // Skip macOS metadata and hidden files
      if (entry.path.includes("__MACOSX") || name.includes("__macosx"))
        return false;
      if (name.startsWith(".")) return false;
      const ext = name.slice(name.lastIndexOf("."));
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .sort((a, b) => {
      const pathA = a.path + a.file.name;
      const pathB = b.path + b.file.name;
      return pathA.localeCompare(pathB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

  const totalPages = imageFiles.length;
  const pages: Blob[] = [];

  // Report initial progress
  onProgress?.(0, totalPages);

  // Extract all images as blobs
  for (let i = 0; i < imageFiles.length; i++) {
    // Check for cancellation before each file
    if (signal?.aborted) {
      throw new DOMException("Parsing was cancelled", "AbortError");
    }

    const entry = imageFiles[i];
    // Extract the file (CompressedFile -> File)
    const extractedFile = await entry.file.extract();
    pages.push(extractedFile);

    // Report progress
    onProgress?.(i + 1, totalPages);
  }

  // Extract title from filename
  const title = file.name.replace(/\.(cbr|rar)$/i, "");

  return {
    pages,
    metadata: {
      title,
      totalPages: pages.length,
      fileName: file.name,
      fileSize: file.size,
      format: "cbr",
    },
  };
}
