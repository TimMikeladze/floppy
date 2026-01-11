"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useReading } from "@/lib/reading-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist"

// Lazy-load pdfjs
let pdfjsLib: typeof import("pdfjs-dist") | null = null
let workerInitialized = false

async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
  }

  if (!workerInitialized) {
    const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
    workerInitialized = true
  }

  return pdfjsLib
}

interface PdfViewerProps {
  file: File
  currentPage: number
  onPageChange: (page: number) => void
  onTotalPagesChange?: (total: number) => void
  password?: string
}

export function PdfViewer({
  file,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  password,
}: PdfViewerProps) {
  const { settings } = useReading()
  const isMobile = useIsMobile()
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const secondCanvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)
  const secondRenderTaskRef = useRef<RenderTask | null>(null)

  const touchStartRef = useRef({
    x: 0,
    y: 0,
    distance: 0,
    scale: 1,
    position: { x: 0, y: 0 },
  })
  const panStartRef = useRef({ touchX: 0, touchY: 0, posX: 0, posY: 0 })
  const swipeStartRef = useRef({ x: 0, y: 0, time: 0 })

  const PAN_SENSITIVITY = isMobile ? 1.8 : 1

  // Load PDF document
  useEffect(() => {
    let cancelled = false
    let loadedPdf: PDFDocumentProxy | null = null

    async function loadPdf() {
      setIsLoading(true)
      setError(null)

      try {
        const pdfjs = await getPdfjs()
        const arrayBuffer = await file.arrayBuffer()

        if (cancelled) return

        loadedPdf = await pdfjs.getDocument({
          data: new Uint8Array(arrayBuffer),
          password,
        }).promise

        if (cancelled) {
          await loadedPdf.destroy()
          return
        }

        setPdf(loadedPdf)
        onTotalPagesChange?.(loadedPdf.numPages)
      } catch (err) {
        if (!cancelled) {
          console.error("[pdf-viewer] Error loading PDF:", err)
          const message = err instanceof Error ? err.message : "Failed to load PDF"
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      cancelled = true
    }
  }, [file, password, onTotalPagesChange])

  // Cleanup PDF on unmount
  useEffect(() => {
    return () => {
      if (pdf) {
        pdf.destroy()
      }
    }
  }, [pdf])

  // Reset zoom when page changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentPage, settings.layoutMode])

  // Apply brightness
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.filter = `brightness(${settings.brightness}%)`
    }
  }, [settings.brightness])

  // Render current page(s)
  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    async function renderPage(
      pageNum: number,
      canvas: HTMLCanvasElement,
      taskRef: React.MutableRefObject<RenderTask | null>
    ): Promise<void> {
      // Cancel any ongoing render
      if (taskRef.current) {
        taskRef.current.cancel()
        taskRef.current = null
      }

      let page: PDFPageProxy | null = null

      try {
        page = await pdf!.getPage(pageNum)
        const container = containerRef.current
        if (!container) return

        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight
        const viewport = page.getViewport({ scale: 1 })

        let renderScale: number
        if (settings.fitMode === "fit-width") {
          const targetWidth = settings.pageLayout === "double" ? containerWidth / 2 : containerWidth
          renderScale = targetWidth / viewport.width
        } else if (settings.fitMode === "fit-height") {
          renderScale = containerHeight / viewport.height
        } else {
          const scaleX =
            (settings.pageLayout === "double" ? containerWidth / 2 : containerWidth) / viewport.width
          const scaleY = containerHeight / viewport.height
          renderScale = Math.min(scaleX, scaleY)
        }

        // Apply device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1
        const scaledViewport = page.getViewport({ scale: renderScale * dpr })

        canvas.width = Math.floor(scaledViewport.width)
        canvas.height = Math.floor(scaledViewport.height)
        canvas.style.width = `${Math.floor(scaledViewport.width / dpr)}px`
        canvas.style.height = `${Math.floor(scaledViewport.height / dpr)}px`

        const ctx = canvas.getContext("2d", { alpha: false })
        if (!ctx) return

        // White background
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // canvas: null is required in pdfjs-dist v5 when using canvasContext
        const renderTask = page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
          canvas: null,
        })

        taskRef.current = renderTask

        await renderTask.promise
      } catch (err) {
        const error = err as Error
        if (error.name !== "RenderingCancelledException") {
          console.error("[pdf-viewer] Render error:", err)
        }
      } finally {
        page?.cleanup()
        taskRef.current = null
      }
    }

    // Render main page
    const pageNum = currentPage + 1 // pdf.js uses 1-based page numbers
    if (pageNum >= 1 && pageNum <= pdf.numPages) {
      renderPage(pageNum, canvasRef.current, renderTaskRef)
    }

    // Render second page for double layout
    if (settings.pageLayout === "double" && secondCanvasRef.current) {
      const secondPageNum = currentPage + 2
      if (secondPageNum <= pdf.numPages) {
        renderPage(secondPageNum, secondCanvasRef.current, secondRenderTaskRef)
      } else {
        // Clear second canvas if no second page
        const ctx = secondCanvasRef.current.getContext("2d")
        if (ctx) {
          secondCanvasRef.current.width = 0
          secondCanvasRef.current.height = 0
        }
      }
    }

    // Cleanup on effect change
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
      if (secondRenderTaskRef.current) {
        secondRenderTaskRef.current.cancel()
        secondRenderTaskRef.current = null
      }
    }
  }, [pdf, currentPage, settings.fitMode, settings.pageLayout])

  // Navigation handlers
  const handlePrevPage = useCallback(() => {
    if (!pdf) return

    if (settings.pageLayout === "double") {
      if (currentPage >= 2) {
        onPageChange(currentPage - 2)
      } else if (currentPage > 0) {
        onPageChange(0)
      }
    } else {
      if (settings.readingDirection === "ltr") {
        if (currentPage > 0) onPageChange(currentPage - 1)
      } else {
        if (currentPage < pdf.numPages - 1) onPageChange(currentPage + 1)
      }
    }
  }, [pdf, currentPage, settings.pageLayout, settings.readingDirection, onPageChange])

  const handleNextPage = useCallback(() => {
    if (!pdf) return

    if (settings.pageLayout === "double") {
      if (currentPage < pdf.numPages - 2) {
        onPageChange(currentPage + 2)
      } else if (currentPage < pdf.numPages - 1) {
        onPageChange(pdf.numPages - 1)
      }
    } else {
      if (settings.readingDirection === "ltr") {
        if (currentPage < pdf.numPages - 1) onPageChange(currentPage + 1)
      } else {
        if (currentPage > 0) onPageChange(currentPage - 1)
      }
    }
  }, [pdf, currentPage, settings.pageLayout, settings.readingDirection, onPageChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (settings.layoutMode === "scrolling") return

      if (e.key === "ArrowLeft" || e.key === "a") {
        handlePrevPage()
      } else if (e.key === "ArrowRight" || e.key === "d") {
        handleNextPage()
      } else if (e.key === "Home") {
        onPageChange(0)
      } else if (e.key === "End" && pdf) {
        onPageChange(pdf.numPages - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [pdf, handlePrevPage, handleNextPage, settings.layoutMode, onPageChange])

  // Click navigation
  const handleContainerClick = (e: React.MouseEvent) => {
    if (scale > 1 || isDragging || settings.layoutMode === "scrolling") return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const zoneWidth = rect.width / 3

    if (clickX < zoneWidth) {
      e.stopPropagation()
      handlePrevPage()
    } else if (clickX > zoneWidth * 2) {
      e.stopPropagation()
      handleNextPage()
    }
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Clamp position
  const clampPosition = useCallback(
    (pos: { x: number; y: number }, currentScale: number) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || currentScale <= 1) return { x: 0, y: 0 }

      const boundaryMultiplier = isMobile ? 0.6 : 0.5
      const maxX = (rect.width * (currentScale - 1)) / 2 + rect.width * boundaryMultiplier
      const maxY = (rect.height * (currentScale - 1)) / 2 + rect.height * boundaryMultiplier

      return {
        x: Math.max(-maxX, Math.min(maxX, pos.x)),
        y: Math.max(-maxY, Math.min(maxY, pos.y)),
      }
    },
    [isMobile]
  )

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
        scale,
        position: { ...position },
      }
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      panStartRef.current = {
        touchX: e.touches[0].clientX,
        touchY: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      }
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    } else if (e.touches.length === 1 && scale === 1 && settings.swipeToTurnPages) {
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const scaleDelta = distance / touchStartRef.current.distance
      const newScale = Math.max(1, Math.min(4, touchStartRef.current.scale * scaleDelta))

      const pinchCenterX = (touch1.clientX + touch2.clientX) / 2
      const pinchCenterY = (touch1.clientY + touch2.clientY) / 2
      const containerCenterX = rect.left + rect.width / 2
      const containerCenterY = rect.top + rect.height / 2

      const offsetX = pinchCenterX - containerCenterX
      const offsetY = pinchCenterY - containerCenterY

      const scaleRatio = newScale / touchStartRef.current.scale
      const newPosition = {
        x: touchStartRef.current.position.x - offsetX * (scaleRatio - 1),
        y: touchStartRef.current.position.y - offsetY * (scaleRatio - 1),
      }

      setScale(newScale)
      setPosition(clampPosition(newPosition, newScale))
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault()
      const deltaX = (e.touches[0].clientX - panStartRef.current.touchX) * PAN_SENSITIVITY
      const deltaY = (e.touches[0].clientY - panStartRef.current.touchY) * PAN_SENSITIVITY

      const newPos = {
        x: panStartRef.current.posX + deltaX,
        y: panStartRef.current.posY + deltaY,
      }

      setPosition(clampPosition(newPos, scale))
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      if (scale === 1 && settings.swipeToTurnPages && swipeStartRef.current.time > 0) {
        const touch = e.changedTouches[0]
        const deltaX = touch.clientX - swipeStartRef.current.x
        const deltaY = touch.clientY - swipeStartRef.current.y
        const deltaTime = Date.now() - swipeStartRef.current.time
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const velocity = distance / deltaTime

        const MIN_SWIPE_DISTANCE = 50
        const MIN_SWIPE_VELOCITY = 0.3

        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        if (distance >= MIN_SWIPE_DISTANCE && velocity >= MIN_SWIPE_VELOCITY && isHorizontal) {
          if (settings.readingDirection === "ltr") {
            if (deltaX < 0) handleNextPage()
            else handlePrevPage()
          } else {
            if (deltaX > 0) handleNextPage()
            else handlePrevPage()
          }
        }

        swipeStartRef.current = { x: 0, y: 0, time: 0 }
      }

      setIsDragging(false)
      if (scale < 1.1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      panStartRef.current = {
        touchX: e.touches[0].clientX,
        touchY: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      }
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale((prev) => Math.max(1, Math.min(4, prev * delta)))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="text-center text-destructive">
          <p className="font-medium">Failed to load PDF</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const transitionClass =
    settings.pageTransition === "slide"
      ? "page-transition-slide"
      : settings.pageTransition === "fade"
        ? "page-transition-fade"
        : ""

  return (
    <div
      ref={containerRef}
      className="reader-container relative h-full w-full overflow-hidden bg-background"
      onClick={handleContainerClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      style={{
        cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        touchAction: "none",
      }}
    >
      <div className="flex h-full items-center justify-center">
        {settings.pageLayout === "double" ? (
          <div className="flex h-full items-center justify-center gap-1">
            <canvas
              ref={settings.readingDirection === "rtl" ? secondCanvasRef : canvasRef}
              className={`max-h-full select-none ${transitionClass}`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center center",
              }}
            />
            <canvas
              ref={settings.readingDirection === "rtl" ? canvasRef : secondCanvasRef}
              className={`max-h-full select-none ${transitionClass}`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center center",
              }}
            />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={`max-h-full select-none ${transitionClass}`}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: "center center",
            }}
          />
        )}
      </div>

      {/* Navigation arrows */}
      {scale === 1 && !settings.hideNavigationArrows && pdf && (
        <>
          {currentPage > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:opacity-100 hover:bg-black/50 md:opacity-70"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevPage()
              }}
            >
              <ChevronLeft className="h-10 w-10" />
              <span className="sr-only">Previous page</span>
            </Button>
          )}
          {currentPage < pdf.numPages - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-black/30 text-white opacity-0 transition-opacity hover:opacity-100 hover:bg-black/50 md:opacity-70"
              onClick={(e) => {
                e.stopPropagation()
                handleNextPage()
              }}
            >
              <ChevronRight className="h-10 w-10" />
              <span className="sr-only">Next page</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
}
