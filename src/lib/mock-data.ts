import type { Comic } from "./types"
import { saveComic, savePage } from "./storage"

// Generate a mock comic page as a blob
async function generateMockPage(pageNumber: number, totalPages: number, title: string): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = 1200
  canvas.height = 1800
  const ctx = canvas.getContext("2d")!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, "#2a2a2a")
  gradient.addColorStop(1, "#1a1a1a")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Page content
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 48px serif"
  ctx.textAlign = "center"
  ctx.fillText(title, canvas.width / 2, 100)

  ctx.font = "32px sans-serif"
  ctx.fillStyle = "#e85d4d"
  ctx.fillText(`Page ${pageNumber + 1}`, canvas.width / 2, canvas.height / 2)

  ctx.font = "24px sans-serif"
  ctx.fillStyle = "#999"
  ctx.fillText(`${pageNumber + 1} of ${totalPages}`, canvas.width / 2, canvas.height - 100)

  // Decorative elements
  ctx.strokeStyle = "#e85d4d"
  ctx.lineWidth = 3
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob!)
      },
      "image/jpeg",
      0.9,
    )
  })
}

// Generate a cover image
async function generateMockCover(title: string, color: string): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = 600
  canvas.height = 900
  const ctx = canvas.getContext("2d")!

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, "#1a1a1a")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Title
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 56px serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Word wrap title
  const words = title.split(" ")
  let line = ""
  let y = canvas.height / 2 - 40
  const lineHeight = 70

  for (const word of words) {
    const testLine = line + word + " "
    const metrics = ctx.measureText(testLine)
    if (metrics.width > canvas.width - 100 && line !== "") {
      ctx.fillText(line, canvas.width / 2, y)
      line = word + " "
      y += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, canvas.width / 2, y)

  // Border
  ctx.strokeStyle = "#e85d4d"
  ctx.lineWidth = 8
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

  return canvas.toDataURL("image/jpeg", 0.9)
}

export const MOCK_COMICS_DATA = [
  {
    title: "The Wanderer's Tale",
    series: "The Wanderer",
    issue: "#1",
    totalPages: 24,
    color: "#d94330",
  },
  {
    title: "Neon Nights",
    series: "Neon Nights",
    issue: "#5",
    totalPages: 28,
    color: "#7b68ee",
  },
  {
    title: "Cosmic Legends",
    series: "Cosmic",
    issue: "#12",
    totalPages: 32,
    color: "#1e90ff",
  },
  {
    title: "Shadow Protocol",
    series: "Protocol",
    issue: "#3",
    totalPages: 20,
    color: "#2d4a3e",
  },
  {
    title: "Desert Storm Chronicles",
    series: "Desert Storm",
    issue: "#7",
    totalPages: 26,
    color: "#d4a574",
  },
]

export async function loadMockComics(): Promise<void> {
  for (const mockData of MOCK_COMICS_DATA) {
    const comicId = crypto.randomUUID()
    const coverImage = await generateMockCover(mockData.title, mockData.color)

    // Generate and save mock pages
    for (let i = 0; i < mockData.totalPages; i++) {
      const pageBlob = await generateMockPage(i, mockData.totalPages, mockData.title)
      await savePage(comicId, i, pageBlob)
    }

    // Create comic entry
    const comic: Comic = {
      id: comicId,
      title: mockData.title,
      coverImage,
      totalPages: mockData.totalPages,
      currentPage: 0,
      series: mockData.series,
      issue: mockData.issue,
      fileName: `${mockData.title}.cbz`,
      fileSize: mockData.totalPages * 150000, // Approximate size
      hasFile: true,
    }

    await saveComic(comic)
  }
}
