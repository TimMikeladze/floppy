"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Github,
  Heart,
  BookOpen,
  Cloud,
  FolderOpen,
  Bookmark,
  StickyNote,
  Smartphone,
  Zap,
  ArrowRight,
  Shield,
  Download,
  Moon,
  Search,
  Layers,
  FileText,
  List,
  Image as ImageIcon,
  Settings,
  Wifi,
  WifiOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"
import { getAllComics } from "@/lib/storage"

const features = [
  {
    icon: BookOpen,
    title: "Beautiful Reader",
    description: "Smooth page navigation, zoom controls, and customizable reading modes for the perfect reading experience",
    panel: "01",
  },
  {
    icon: FolderOpen,
    title: "Multi-Format Support",
    description: "Open CBZ, CBR, PDF, and EPUB files directly from your device",
    panel: "02",
  },
  {
    icon: Cloud,
    title: "Remote Sources",
    description: "Add comics from URLs and external data sources for cloud-based libraries",
    panel: "03",
  },
  {
    icon: Bookmark,
    title: "Bookmarks",
    description: "Save your place, mark favorite pages, and add thumbnail captures",
    panel: "04",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description: "Add personal notes to any page with color-coded organization",
    panel: "05",
  },
  {
    icon: Smartphone,
    title: "PWA Support",
    description: "Install as a native app on any device for offline access",
    panel: "06",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "All data stays on your device. No cloud, no tracking, no accounts required",
    panel: "07",
  },
  {
    icon: Search,
    title: "Smart Search",
    description: "Quickly find comics by title, series, or issue number",
    panel: "08",
  },
  {
    icon: List,
    title: "Custom Lists",
    description: "Organize with Reading, Completed, Want to Read, and custom collections",
    panel: "09",
  },
  {
    icon: Layers,
    title: "Series Grouping",
    description: "Automatically group comics by series for easy navigation",
    panel: "10",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "System-aware theming with light, dark, and auto modes",
    panel: "11",
  },
  {
    icon: Download,
    title: "Import & Export",
    description: "Backup your library to JSON and restore anytime",
    panel: "12",
  },
]

const techStack = ["Next.js", "React", "TypeScript", "Tailwind", "IndexedDB"]

// Screenshot placeholder component
function ScreenshotPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`relative bg-muted/30 border-2 border-dashed border-foreground/10 rounded-lg overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/60 font-medium">{label}</span>
        </div>
      </div>
      {/* Aspect ratio placeholder */}
      <div className="aspect-[16/10]" />
    </div>
  )
}

export function LandingPageClient() {
  const router = useRouter()
  const [supportOpen, setSupportOpen] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [hasVisited, setHasVisited] = useState(false)

  useEffect(() => {
    async function checkReturningUser() {
      try {
        // Check if user has any comics in their library
        const comics = await getAllComics()

        // Also check localStorage for a visited flag
        const hasVisitedBefore = localStorage.getItem("floppy_has_visited") === "true"

        if (comics.length > 0 || hasVisitedBefore) {
          // User has used the app before, redirect to library
          router.replace("/library")
          return
        }

        setHasVisited(false)
        setIsChecking(false)
      } catch (error) {
        // On error, show landing page
        console.error("Error checking returning user:", error)
        setIsChecking(false)
      }
    }

    checkReturningUser()
  }, [router])

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div
            className="mx-auto p-6 rounded-3xl mb-4 inline-block"
            style={{
              background: 'linear-gradient(135deg, var(--card) 0%, var(--secondary) 100%)',
              boxShadow: '0 8px 32px oklch(0 0 0 / 0.2), 0 0 0 1px var(--border)'
            }}
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  function handleGetStarted() {
    // Mark as visited so they go directly to library next time
    localStorage.setItem("floppy_has_visited", "true")
    router.push("/library")
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="safe-top safe-x bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 md:px-8 gap-3 mx-auto w-full max-w-screen-2xl safe-x">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 border-2 border-foreground flex items-center justify-center relative group">
              <div className="w-3 h-3 bg-foreground transition-transform group-hover:scale-110" />
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-background border border-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">floppy</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/TimMikeladze/floppy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-2 text-xs">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </a>
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="gap-2 text-xs font-medium"
            >
              Open App
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-lg px-4 sm:px-6 md:px-8 py-12 pb-32 relative">
        {/* Hero Section */}
        <section className="relative mb-16">
          {/* Large background text */}
          <div className="absolute -top-8 -left-4 text-[12rem] sm:text-[16rem] font-bold leading-none text-foreground/[0.02] select-none pointer-events-none tracking-tighter">
            FL
          </div>

          <div className="relative grid lg:grid-cols-[1fr,1.2fr] gap-12 items-center">
            {/* Left: Branding */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Logo mark */}
              <div className="w-16 h-16 border-2 border-foreground flex items-center justify-center relative group">
                <div className="w-6 h-6 bg-foreground transition-transform group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-background border border-foreground" />
              </div>

              <div className="space-y-2">
                <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter">
                  floppy
                </h1>
                <p className="text-lg text-muted-foreground font-medium tracking-wide">
                  Open-source comic reader
                </p>
              </div>

              <p className="text-sm text-muted-foreground max-w-md leading-relaxed border-l-2 border-foreground/20 pl-4">
                A modern, privacy-focused comic reader that runs entirely in your browser.
                Your comics stay on your device — no cloud, no tracking, no accounts.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handleGetStarted}
                  className="gap-2 font-medium tracking-wide"
                  size="lg"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <a
                  href="https://github.com/TimMikeladze/floppy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 border-2 hover:bg-foreground hover:text-background transition-all font-medium tracking-wide"
                  >
                    <Github className="w-4 h-4" />
                    View Source
                  </Button>
                </a>
              </div>

              {/* Quick highlights */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Works Offline</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  <span>100% Private</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Download className="w-3.5 h-3.5" />
                  <span>Installable PWA</span>
                </div>
              </div>
            </div>

            {/* Right: Screenshot placeholder */}
            <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
              <ScreenshotPlaceholder
                label="Library View Screenshot"
                className="shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* App Screenshots Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <ImageIcon className="w-5 h-5" />
            <h3 className="text-sm font-medium tracking-widest uppercase">Screenshots</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScreenshotPlaceholder
              label="Comic Reader View"
              className="shadow-lg"
            />
            <ScreenshotPlaceholder
              label="Series View"
              className="shadow-lg"
            />
            <ScreenshotPlaceholder
              label="Bookmarks & Notes"
              className="shadow-lg"
            />
            <ScreenshotPlaceholder
              label="Mobile View"
              className="shadow-lg"
            />
          </div>
        </section>

        {/* Features - Comic Panel Grid */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <Zap className="w-5 h-5" />
            <h3 className="text-sm font-medium tracking-widest uppercase">Features</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-background p-6 relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Panel number */}
                <span className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                  {feature.panel}
                </span>

                {/* Content */}
                <div className="space-y-3">
                  <div className="w-10 h-10 border border-foreground/20 flex items-center justify-center group-hover:border-foreground/40 group-hover:bg-foreground/5 transition-all">
                    <feature.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h4 className="font-semibold tracking-tight">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>

                {/* Corner accent on hover */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Supported Formats */}
        <section className="mb-20 animate-in fade-in duration-700 delay-300">
          <div className="flex items-center gap-4 mb-8">
            <FileText className="w-5 h-5" />
            <h3 className="text-sm font-medium tracking-widest uppercase">Supported Formats</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { format: "CBZ", description: "Comic Book Zip" },
              { format: "CBR", description: "Comic Book RAR" },
              { format: "PDF", description: "Portable Document" },
              { format: "EPUB", description: "Electronic Publication" },
            ].map((item) => (
              <div
                key={item.format}
                className="border-2 border-foreground/10 p-4 text-center hover:border-foreground/30 transition-colors"
              >
                <div className="text-2xl font-bold tracking-tight font-mono">{item.format}</div>
                <div className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase">{item.description}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Inline list */}
        <section className="mb-20 animate-in fade-in duration-700 delay-500">
          <div className="border-2 border-dashed border-foreground/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground shrink-0">
                Built with
              </span>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, index) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 text-xs font-mono border border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 transition-all cursor-default"
                    style={{ animationDelay: `${600 + index * 50}ms` }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-20 text-center animate-in fade-in duration-700 delay-600">
          <div className="border-2 border-foreground p-8 sm:p-12">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Ready to start reading?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              No sign up required. Just open the app and start adding your comics.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="gap-2 font-medium"
              >
                Open Library
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-2"
                onClick={() => setSupportOpen(true)}
              >
                <Heart className="w-4 h-4" />
                Support Project
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center animate-in fade-in duration-700 delay-700">
          <div className="inline-flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-8 h-px bg-border" />
            <span className="tracking-wide">Made for comic enthusiasts</span>
            <span className="w-8 h-px bg-border" />
          </div>
        </footer>
      </main>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
