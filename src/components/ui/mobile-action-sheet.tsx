"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileActionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
}

export function MobileActionSheet({
  open,
  onOpenChange,
  title,
  children,
}: MobileActionSheetProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 safe-bottom",
          "animate-in slide-in-from-bottom duration-300"
        )}
      >
        <div
          className="rounded-t-3xl overflow-hidden"
          style={{
            background: 'var(--card)',
            boxShadow: '0 -4px 32px oklch(0 0 0 / 0.25)',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <h3 className="text-base font-semibold">{title}</h3>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* Safe area padding */}
          <div className="safe-bottom" />
        </div>
      </div>
    </>
  )
}

interface ActionSheetItemProps {
  icon?: React.ReactNode
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

export function ActionSheetItem({
  icon,
  children,
  onClick,
  variant = "default",
  disabled = false,
}: ActionSheetItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3.5 text-left",
        "transition-colors active:bg-muted/80",
        "disabled:opacity-50 disabled:pointer-events-none",
        variant === "destructive" && "text-destructive",
        variant === "default" && "text-foreground"
      )}
    >
      {icon && (
        <span className={cn(
          "flex-shrink-0",
          variant === "destructive" ? "text-destructive" : "text-muted-foreground"
        )}>
          {icon}
        </span>
      )}
      <span className="font-medium">{children}</span>
    </button>
  )
}

export function ActionSheetSeparator() {
  return <div className="h-px bg-border/50 mx-4 my-1" />
}

export function ActionSheetLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {children}
    </div>
  )
}
