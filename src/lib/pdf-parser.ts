import type { ComicFormat } from "./types"

// Lazy-load pdfjs to reduce initial bundle size
let pdfjsLib: typeof import("pdfjs-dist") | null = null

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
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
}

/**
 * Parse a PDF file and render all pages as images
 */
export async function parsePdfFile(file: File, scale = 2): Promise<PdfParseResult> {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  const pages: Blob[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext("2d")!

    await page.render({ canvasContext: ctx, viewport, canvas }).promise

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
