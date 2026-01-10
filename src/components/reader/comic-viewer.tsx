"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useReading } from "@/lib/reading-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ComicViewerProps {
  pages: string[]
  currentPage: number
  onPageChange: (page: number) => void
}

export function ComicViewer({ pages, currentPage, onPageChange }: ComicViewerProps) {
  const { settings } = useReading()
  const isMobile = useIsMobile()
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const touchStartRef = useRef({
    x: 0,
    y: 0,
    distance: 0,
    scale: 1,
    position: { x: 0, y: 0 }
  })
  const panStartRef = useRef({ touchX: 0, touchY: 0, posX: 0, posY: 0 })
  const swipeStartRef = useRef({ x: 0, y: 0, time: 0 })

  // Pan sensitivity multiplier for mobile - makes panning more responsive when zoomed in
  const PAN_SENSITIVITY = isMobile ? 1.8 : 1

  // Reset zoom and position when page changes or layout mode changes
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (settings.layoutMode === "scrolling") return

      if (e.key === "ArrowLeft" || e.key === "a") {
        handlePrevPage()
      } else if (e.key === "ArrowRight" || e.key === "d") {
        handleNextPage()
      } else if (e.key === "Home") {
        onPageChange(0)
      } else if (e.key === "End") {
        onPageChange(pages.length - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, pages.length, settings.layoutMode])

  const handlePrevPage = () => {
    if (settings.pageLayout === "double" && currentPage >= 2) {
      onPageChange(currentPage - 2)
    } else if (settings.pageLayout === "single" && currentPage > 0) {
      if (settings.readingDirection === "ltr") {
        onPageChange(currentPage - 1)
      } else {
        onPageChange(currentPage + 1)
      }
    }
  }

  const handleNextPage = () => {
    if (settings.pageLayout === "double" && currentPage < pages.length - 2) {
      onPageChange(currentPage + 2)
    } else if (settings.pageLayout === "single") {
      if (settings.readingDirection === "ltr") {
        if (currentPage < pages.length - 1) onPageChange(currentPage + 1)
      } else {
        if (currentPage > 0) onPageChange(currentPage - 1)
      }
    }
  }

  // Touch/click navigation zones
  const handleContainerClick = (e: React.MouseEvent) => {
    if (scale > 1 || isDragging || settings.layoutMode === "scrolling") return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = e.clientX - rect.left
    const zoneWidth = rect.width / 3

    if (clickX < zoneWidth) {
      e.stopPropagation() // Prevent toggle controls
      handlePrevPage()
    } else if (clickX > zoneWidth * 2) {
      e.stopPropagation() // Prevent toggle controls
      handleNextPage()
    }
    // Center zone click bubbles up to toggle controls
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1 && settings.layoutMode !== "scrolling") return
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    if (scale <= 1 && settings.layoutMode !== "scrolling") return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Get container dimensions for boundary calculations
  const getContainerRect = () => containerRef.current?.getBoundingClientRect()

  // Clamp position to keep image within reasonable bounds when zoomed
  const clampPosition = (pos: { x: number; y: number }, currentScale: number) => {
    const rect = getContainerRect()
    if (!rect || currentScale <= 1) return { x: 0, y: 0 }

    // Allow more generous panning boundaries - more freedom on mobile for better UX
    const boundaryMultiplier = isMobile ? 0.6 : 0.5
    const maxX = (rect.width * (currentScale - 1)) / 2 + rect.width * boundaryMultiplier
    const maxY = (rect.height * (currentScale - 1)) / 2 + rect.height * boundaryMultiplier

    return {
      x: Math.max(-maxX, Math.min(maxX, pos.x)),
      y: Math.max(-maxY, Math.min(maxY, pos.y)),
    }
  }

  // Touch handlers for pinch zoom and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && settings.layoutMode !== "scrolling") {
      // Pinch zoom start - store initial state
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
        scale,
        position: { ...position }
      }
    } else if (e.touches.length === 1 && (scale > 1 || settings.layoutMode === "scrolling")) {
      // Pan start - store initial touch position and current position
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
    } else if (e.touches.length === 1 && scale === 1 && settings.swipeToTurnPages && settings.layoutMode !== "scrolling") {
      // Swipe start - store initial position and time for swipe detection
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && settings.layoutMode !== "scrolling") {
      // Pinch zoom - zoom toward pinch center
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      const rect = getContainerRect()
      if (!rect) return

      // Calculate new scale based on initial scale (not current)
      const scaleDelta = distance / touchStartRef.current.distance
      const newScale = Math.max(1, Math.min(4, touchStartRef.current.scale * scaleDelta))

      // Calculate pinch center relative to container center
      const pinchCenterX = (touch1.clientX + touch2.clientX) / 2
      const pinchCenterY = (touch1.clientY + touch2.clientY) / 2
      const containerCenterX = rect.left + rect.width / 2
      const containerCenterY = rect.top + rect.height / 2

      // Offset from container center to pinch center
      const offsetX = pinchCenterX - containerCenterX
      const offsetY = pinchCenterY - containerCenterY

      // Adjust position to zoom toward pinch center
      const scaleRatio = newScale / touchStartRef.current.scale
      const newPosition = {
        x: touchStartRef.current.position.x - offsetX * (scaleRatio - 1),
        y: touchStartRef.current.position.y - offsetY * (scaleRatio - 1),
      }

      setScale(newScale)
      setPosition(clampPosition(newPosition, newScale))
    } else if (e.touches.length === 1 && isDragging && (scale > 1 || settings.layoutMode === "scrolling")) {
      // Pan with boundaries and sensitivity multiplier for responsive mobile panning
      if (scale > 1 || settings.layoutMode === "scrolling") {
        e.preventDefault()
      }

      // Calculate the delta movement from initial touch position
      const deltaX = (e.touches[0].clientX - panStartRef.current.touchX) * PAN_SENSITIVITY
      const deltaY = (e.touches[0].clientY - panStartRef.current.touchY) * PAN_SENSITIVITY

      // Apply pan sensitivity multiplier for more responsive panning
      const newPos = {
        x: panStartRef.current.posX + deltaX,
        y: panStartRef.current.posY + deltaY,
      }

      setPosition(scale > 1 ? clampPosition(newPos, scale) : newPos)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // Check for swipe gesture when scale is 1
      if (scale === 1 && settings.swipeToTurnPages && settings.layoutMode !== "scrolling" && swipeStartRef.current.time > 0) {
        const touch = e.changedTouches[0]
        const deltaX = touch.clientX - swipeStartRef.current.x
        const deltaY = touch.clientY - swipeStartRef.current.y
        const deltaTime = Date.now() - swipeStartRef.current.time
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const velocity = distance / deltaTime

        // Swipe thresholds
        const MIN_SWIPE_DISTANCE = 50
        const MIN_SWIPE_VELOCITY = 0.3

        // Check if it's a valid horizontal swipe
        const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)
        if (distance >= MIN_SWIPE_DISTANCE && velocity >= MIN_SWIPE_VELOCITY && isHorizontal) {
          // Determine direction based on reading direction setting
          if (settings.readingDirection === "ltr") {
            // LTR: swipe left = next, swipe right = prev
            if (deltaX < 0) {
              handleNextPage()
            } else {
              handlePrevPage()
            }
          } else {
            // RTL: swipe right = next, swipe left = prev
            if (deltaX > 0) {
              handleNextPage()
            } else {
              handlePrevPage()
            }
          }
        }

        // Reset swipe tracking
        swipeStartRef.current = { x: 0, y: 0, time: 0 }
      }

      setIsDragging(false)
      // Snap back to no zoom if scale is very close to 1
      if (scale < 1.1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && scale > 1) {
      // Transitioning from pinch to pan - update drag start and pan start
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
    if ((e.ctrlKey || e.metaKey) && settings.layoutMode !== "scrolling") {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale((prev) => Math.max(1, Math.min(4, prev * delta)))
    }
  }

  if (settings.layoutMode === "scrolling") {
    return (
      <div
        ref={containerRef}
        className="reader-container relative h-full w-full overflow-y-auto bg-background"
        style={{ cursor: "default" }}
      >
        <div className="flex flex-col items-center gap-0">
          {pages.map((pageUrl, index) => (
            <div key={index} className="relative w-full max-w-4xl">
              <img
                src={pageUrl || "/placeholder.svg"}
                alt={`Page ${index + 1}`}
                className={`w-full select-none ${
                  settings.fitMode === "fit-width"
                    ? "w-full"
                    : settings.fitMode === "fit-height"
                      ? "h-screen"
                      : "max-w-full"
                }`}
                draggable={false}
                onLoad={() => {
                  // Update current page based on scroll position
                  const element = document.getElementById(`page-${index}`)
                  if (element) {
                    const observer = new IntersectionObserver(
                      (entries) => {
                        entries.forEach((entry) => {
                          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                            onPageChange(index)
                          }
                        })
                      },
                      { threshold: 0.5 },
                    )
                    observer.observe(element)
                  }
                }}
                id={`page-${index}`}
              />
{settings.showPageNumbers && (
                <div className="absolute bottom-4 right-4 rounded-md bg-black/60 px-3 py-1.5 text-sm text-white">
                  Page {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentPageUrl = pages[currentPage]
  const nextPageUrl = settings.pageLayout === "double" ? pages[currentPage + 1] : null

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
        touchAction: "none", // Prevent browser default touch handling
      }}
    >
      <div className="flex h-full items-center justify-center">
        {settings.pageLayout === "double" && nextPageUrl ? (
          <div className="flex h-full items-center justify-center gap-1">
            <img
              src={(settings.readingDirection === "rtl" ? nextPageUrl : currentPageUrl) || "/placeholder.svg"}
              alt={`Page ${settings.readingDirection === "rtl" ? currentPage + 2 : currentPage + 1}`}
              className={`max-h-full select-none ${transitionClass} ${
                settings.fitMode === "fit-width"
                  ? "w-1/2"
                  : settings.fitMode === "fit-height"
                    ? "h-full"
                    : "max-w-[50%]"
              }`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center center",
                opacity: settings.pageTransition === "fade" ? (scale === 1 ? 1 : 0.95) : 1,
              }}
              draggable={false}
            />
            <img
              src={(settings.readingDirection === "rtl" ? currentPageUrl : nextPageUrl) || "/placeholder.svg"}
              alt={`Page ${settings.readingDirection === "rtl" ? currentPage + 1 : currentPage + 2}`}
              className={`max-h-full select-none ${transitionClass} ${
                settings.fitMode === "fit-width"
                  ? "w-1/2"
                  : settings.fitMode === "fit-height"
                    ? "h-full"
                    : "max-w-[50%]"
              }`}
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transformOrigin: "center center",
                opacity: settings.pageTransition === "fade" ? (scale === 1 ? 1 : 0.95) : 1,
              }}
              draggable={false}
            />
          </div>
        ) : (
          <img
            ref={imageRef}
            src={currentPageUrl || "/placeholder.svg"}
            alt={`Page ${currentPage + 1}`}
            className={`max-h-full select-none ${transitionClass} ${
              settings.fitMode === "fit-width" ? "w-full" : settings.fitMode === "fit-height" ? "h-full" : "max-w-full"
            }`}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transformOrigin: "center center",
              opacity: settings.pageTransition === "fade" ? (scale === 1 ? 1 : 0.95) : 1,
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Navigation arrows - only show when not zoomed, in paged mode, and not hidden */}
      {scale === 1 && !settings.hideNavigationArrows && (
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
          {currentPage < pages.length - 1 && (
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
