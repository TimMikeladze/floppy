"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, X } from "lucide-react"
import type { Comic } from "@/lib/types"
import { getSeriesName, getIssueNumber, isSameSeries } from "@/lib/series-utils"
import Link from "next/link"

interface NextIssueOverlayProps {
  currentComic: Comic
  nextIssue: Comic
  isVisible: boolean
  onDismiss: () => void
}

export function NextIssueOverlay({ currentComic, nextIssue, isVisible, onDismiss }: NextIssueOverlayProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Small delay for animation
      const timer = setTimeout(() => setShow(true), 100)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isVisible])

  if (!isVisible) return null

  const isNextInSeries = isSameSeries(currentComic, nextIssue)
  const seriesName = getSeriesName(nextIssue)
  const issueNum = getIssueNumber(nextIssue)

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ease-out ${
        show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
      style={{
        paddingBottom: "calc(1.5rem + var(--safe-area-bottom))",
        paddingLeft: "var(--safe-area-left)",
        paddingRight: "var(--safe-area-right)",
      }}
    >
      <div className="mx-4 rounded-2xl overflow-hidden" style={{
        background: "oklch(from var(--card) l c h / 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 -4px 30px oklch(0 0 0 / 0.3), 0 0 0 1px oklch(1 1 1 / 0.1) inset",
      }}>
        <div className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                {isNextInSeries ? "Continue reading" : "Up next"}
              </p>
              <h3 className="font-semibold text-foreground truncate">
                {isNextInSeries ? (
                  <>
                    {seriesName}
                    {issueNum !== null && <span className="text-muted-foreground"> #{issueNum}</span>}
                  </>
                ) : (
                  nextIssue.title
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Dismiss</span>
              </Button>
              <Button asChild className="gap-2 h-11 px-5">
                <Link href={`/reader/${nextIssue.id}`}>
                  {isNextInSeries ? "Next Issue" : "Read Next"}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
