"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
}

interface UsePullToRefreshReturn {
  isPulling: boolean
  isRefreshing: boolean
  pullProgress: number
  containerRef: React.RefObject<HTMLDivElement>
  indicatorStyle: React.CSSProperties
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null!)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when scrolled to top
    if (window.scrollY > 0) return

    startYRef.current = e.touches[0].clientY
    setIsPulling(true)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return
    if (window.scrollY > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }

    currentYRef.current = e.touches[0].clientY
    const diff = currentYRef.current - startYRef.current

    if (diff > 0) {
      // Apply resistance - pulling feels heavier as you go
      const resistance = Math.min(diff * 0.5, maxPull)
      setPullDistance(resistance)

      // Prevent default scroll when pulling
      if (diff > 10) {
        e.preventDefault()
      }
    }
  }, [isPulling, isRefreshing, maxPull])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)

      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }

    setIsPulling(false)
    setPullDistance(0)
    startYRef.current = 0
    currentYRef.current = 0
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use passive: false to allow preventDefault on touchmove
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const pullProgress = Math.min(pullDistance / threshold, 1)

  const indicatorStyle: React.CSSProperties = {
    height: isRefreshing ? 60 : pullDistance,
    opacity: pullProgress,
    transition: isPulling ? "none" : "all 0.3s ease",
  }

  return {
    isPulling,
    isRefreshing,
    pullProgress,
    containerRef,
    indicatorStyle,
  }
}
