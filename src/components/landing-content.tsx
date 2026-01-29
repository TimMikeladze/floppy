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
  Library,
  Calendar,
  Layers,
  ListChecks,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"
import { FreeComicsSources } from "@/components/free-comics-sources"

const features = [
  {
    icon: BookOpen,
    title: "Beautiful Reader",
    description: "Read CBZ, CBR, PDF, and EPUB files with single or double-page layouts. Swipe, zoom, and navigate with intuitive gesture controls.",
  },
  {
    icon: Calendar,
    title: "Weekly Releases",
    description: "Never miss a new issue. Browse this week's releases, discover new series, and see what's dropping next.",
  },
  {
    icon: ListChecks,
    title: "Pull List",
    description: "Follow the series you love. Get notified when new issues drop. Your personal pull list, always current.",
  },
  {
    icon: Library,
    title: "Your Library",
    description: "Your entire collection in one place. Filter by series, reading status, or create custom collections.",
  },
  {
    icon: Layers,
    title: "Smart Organization",
    description: "Issues automatically group by series. Track your progress through runs and never lose your place.",
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Notes",
    description: "Mark pages, add notes, and pick up exactly where you left off. Your reading progress, always saved.",
  },
]

const formats = ["CBZ", "CBR", "PDF", "EPUB"]

interface LandingContentProps {
  onGetStarted?: () => void
}

export function LandingContent({ onGetStarted }: LandingContentProps) {
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-background rounded-[2px]" />
            </div>
            <span className="font-semibold tracking-tight">floppy</span>
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
              Open App
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
              Your comics.<br />
              One app.<br />
              Zero friction.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              The open-source comic reader that does it all. Read your collection, track new releases, and manage your pull list—no account required, works offline.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="gap-2"
              >
                Get Started
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
          <h2 className="text-lg font-medium mb-8">Get started in seconds</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="text-sm text-muted-foreground mb-2">01</div>
              <h3 className="font-medium mb-1">Drop in your comics</h3>
              <p className="text-sm text-muted-foreground">
                Drag files from your device or paste URLs. Your collection stays on your device—private and secure.
              </p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">02</div>
              <h3 className="font-medium mb-1">Discover what's new</h3>
              <p className="text-sm text-muted-foreground">
                Browse weekly releases, find new series, and build your pull list to track what's coming.
              </p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">03</div>
              <h3 className="font-medium mb-1">Read anywhere</h3>
              <p className="text-sm text-muted-foreground">
                Open in your browser or install as an app. Your progress syncs automatically across your library.
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
              <h2 className="text-lg font-medium mb-4">100% Open Source</h2>
              <p className="text-sm text-muted-foreground mb-4">
                No subscriptions. No tracking. No data harvesting. Just a well-crafted app you can trust, inspect, and modify.
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
              <h2 className="text-lg font-medium mb-4">Offline-first</h2>
              <p className="text-sm text-muted-foreground">
                Install on any device and read anywhere—even without internet. Your library lives on your device, always available.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-xl font-medium mb-2">Ready to dive in?</h2>
              <p className="text-sm text-muted-foreground">Free forever. No sign-up needed.</p>
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
