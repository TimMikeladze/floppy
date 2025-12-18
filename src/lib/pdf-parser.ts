import type { ComicFormat, PdfRenderMode } from "./types"

// Lazy-load pdfjs to reduce initial bundle size
let pdfjsLib: typeof import("pdfjs-dist") | null = null

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
    // Set worker source - use CDN for simplicity
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }
  return pdfjsLib
}

export interface PdfParseResult {
  pages: Blob[]
  metadata: {
    title: string
    totalPages: number
    fileName: string
    fileSize: number
    format: ComicFormat
  }
  // For native rendering mode, we store the raw PDF data
  pdfData?: ArrayBuffer
}

/**
 * Parse a PDF file and render pages as images
 * This mode converts each page to a PNG blob for consistent storage with CBZ/CBR
 */
export async function parsePdfAsImages(file: File, scale = 2): Promise<PdfParseResult> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pages: Blob[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    // Create canvas for rendering
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!

    await page.render({ canvasContext: ctx, viewport, canvas }).promise

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob from canvas"))
        },
        "image/png",
        0.92
      )
    })

    pages.push(blob)
  }

  const title = file.name.replace(/\.pdf$/i, "")

  return {
    pages,
    metadata: {
      title,
      totalPages: pdf.numPages,
      fileName: file.name,
      fileSize: file.size,
      format: "pdf",
    },
  }
}

/**
 * Parse PDF for native rendering mode
 * Returns minimal page data but stores the raw PDF for direct rendering
 */
export async function parsePdfNative(file: File): Promise<PdfParseResult> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  // Generate cover image from first page
  const firstPage = await pdf.getPage(1)
  const viewport = firstPage.getViewport({ scale: 1.5 })
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext("2d")!
  await firstPage.render({ canvasContext: ctx, viewport, canvas }).promise

  const coverBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to create cover blob"))
      },
      "image/png",
      0.92
    )
  })

  const title = file.name.replace(/\.pdf$/i, "")

  return {
    pages: [coverBlob], // Only cover for native mode, pages rendered on-demand
    pdfData: arrayBuffer,
    metadata: {
      title,
      totalPages: pdf.numPages,
      fileName: file.name,
      fileSize: file.size,
      format: "pdf",
    },
  }
}

/**
 * Render a single PDF page on-demand for native mode
 */
export async function renderPdfPage(
  pdfData: ArrayBuffer,
  pageNumber: number,
  scale = 2
): Promise<Blob> {
  const pdfjs = await getPdfjs()
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext("2d")!

  await page.render({ canvasContext: ctx, viewport, canvas }).promise

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Failed to render PDF page"))
      },
      "image/png",
      0.92
    )
  })
}

/**
 * Get PDF document info without full parsing
 */
export async function getPdfInfo(pdfData: ArrayBuffer): Promise<{ numPages: number }> {
  const pdfjs = await getPdfjs()
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise
  return { numPages: pdf.numPages }
}
