"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Github,
  Heart,
  BookOpen,
  FolderOpen,
  Bookmark,
  ArrowRight,
  ArrowLeft,
  Library,
  Calendar,
  Layers,
  Search,
  ListChecks,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"
import { FreeComicsSources } from "@/components/free-comics-sources"

const features = [
  {
    icon: BookOpen,
    title: "Reader",
    description: "CBZ, CBR, PDF, EPUB. Single and double-page layouts with gesture controls.",
  },
  {
    icon: Calendar,
    title: "Releases",
    description: "Browse weekly releases. See what's coming out and what you might have missed.",
  },
  {
    icon: ListChecks,
    title: "Pull List",
    description: "Follow series and track upcoming issues. Your personal pull list, always up to date.",
  },
  {
    icon: Library,
    title: "Library",
    description: "Organize your collection by series, reading status, or custom lists.",
  },
  {
    icon: Layers,
    title: "Series Tracking",
    description: "Auto-group issues by series. Track your progress through runs.",
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Notes",
    description: "Save your place. Add notes to pages. Pick up where you left off.",
  },
]

const formats = ["CBZ", "CBR", "PDF", "EPUB"]

interface LandingContentProps {
  showBackButton?: boolean
  onGetStarted?: () => void
}

export function LandingContent({ showBackButton = false, onGetStarted }: LandingContentProps) {
  const [supportOpen, setSupportOpen] = useState(false)

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      window.location.href = "/library"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="safe-top safe-x bg-background/80 backdrop-blur-xl" />
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 md:px-8 mx-auto w-full max-w-screen-xl safe-x">
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <>
                <Link href="/library">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <span className="text-sm font-medium">About</span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-foreground rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-background rounded-[2px]" />
                </div>
                <span className="font-semibold tracking-tight">floppy</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/TimMikeladze/floppy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-2 text-sm">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </a>
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="gap-1.5"
            >
              {showBackButton ? "Library" : "Open App"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
        {/* Hero */}
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Comic book reader,<br />
              release tracker,<br />
              pull list manager.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Read your collection. Discover new releases. Track the series you follow. All in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="gap-2"
              >
                {showBackButton ? "Open Library" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="w-4 h-4" />
                  GitHub
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 border-t border-border/40">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature) => (
              <div key={feature.title}>
                <feature.icon className="w-5 h-5 mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Formats */}
        <section className="py-16 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderOpen className="w-4 h-4" />
              <span>Formats</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <span
                  key={format}
                  className="px-3 py-1 text-sm font-mono border border-border rounded"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 border-t border-border/40">
          <h2 className="text-lg font-medium mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="text-sm text-muted-foreground mb-2">01</div>
              <h3 className="font-medium mb-1">Add comics</h3>
              <p className="text-sm text-muted-foreground">
                Import files from your device or add from URLs. Everything stays local.
              </p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">02</div>
              <h3 className="font-medium mb-1">Browse releases</h3>
              <p className="text-sm text-muted-foreground">
                Check the weekly release calendar. Follow series to build your pull list.
              </p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">03</div>
              <h3 className="font-medium mb-1">Read and track</h3>
              <p className="text-sm text-muted-foreground">
                Read in the browser. Your progress syncs across your library automatically.
              </p>
            </div>
          </div>
        </section>

        {/* Free Comics */}
        <section className="py-16 border-t border-border/40">
          <FreeComicsSources variant="full" />
        </section>

        {/* Details */}
        <section className="py-16 border-t border-border/40">
          <div className="grid sm:grid-cols-2 gap-12">
            <div>
              <h2 className="text-lg font-medium mb-4">Open source</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Free to use, free to modify. Built with Next.js, React, and IndexedDB.
              </p>
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline underline-offset-4 hover:text-foreground text-muted-foreground"
              >
                View source on GitHub
              </a>
            </div>
            <div>
              <h2 className="text-lg font-medium mb-4">Works offline</h2>
              <p className="text-sm text-muted-foreground">
                Install as an app on any device. Your library is stored locally and works without internet.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-xl font-medium mb-2">Start reading</h2>
              <p className="text-sm text-muted-foreground">No account required.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleGetStarted} className="gap-2">
                Open Library
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setSupportOpen(true)} className="gap-2">
                <Heart className="w-4 h-4" />
                Support
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>floppy</span>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <Link href="/releases" className="hover:text-foreground transition-colors">
                Releases
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
