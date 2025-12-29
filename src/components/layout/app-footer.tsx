"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Github, Heart } from "lucide-react"
import { SupportDialog } from "./support-dialog"
import { useIsPwa } from "@/hooks/use-is-pwa"

export function AppFooter() {
  const pathname = usePathname()
  const [supportOpen, setSupportOpen] = useState(false)
  const isPwa = useIsPwa()

  // Hide footer on reader pages or in PWA mode
  if (pathname?.startsWith('/reader') || isPwa) {
    return null
  }

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-40 safe-bottom safe-x border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4 md:px-6 py-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {/* Left side - Logo and branding */}
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary/40" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">floppy.sh</span>
                <span className="text-[10px] text-muted-foreground/80">open-source comic book reader</span>
              </div>
            </div>

            {/* Right side - Icon actions */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <button
                onClick={() => setSupportOpen(true)}
                className="hover:text-foreground transition-colors"
                aria-label="Support"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  )
}
