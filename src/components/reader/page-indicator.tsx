"use client"

interface PageIndicatorProps {
  currentPage: number
  totalPages: number
  isVisible: boolean
}

export function PageIndicator({ currentPage, totalPages, isVisible }: PageIndicatorProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-black/70 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
        <span className="tabular-nums">{currentPage + 1}</span>
        <span className="text-white/60 mx-1">/</span>
        <span className="tabular-nums text-white/60">{totalPages}</span>
      </div>
    </div>
  )
}
