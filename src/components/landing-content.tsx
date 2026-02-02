"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import Link from "next/link"
import {
  Github,
  Heart,
  BookOpen,
  Calendar,
  Library,
  ArrowRight,
  Code,
  Shield,
  Zap,
  Users,
  Smartphone,
  Wifi,
  WifiOff,
  Layers,
  Hand,
  Bookmark,
  Search,
  FolderOpen,
  Bell,
  Download,
  Monitor,
  Tablet,
  ChevronRight,
  Twitter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"

// Scroll animation component using Intersection Observer
function ScrollAnimatedSection({
  children,
  className = "",
  animation = "fade-in-up",
}: {
  children: ReactNode
  className?: string
  animation?: "fade-in" | "fade-in-up" | "fade-in-down"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  const animationClasses = {
    "fade-in": isVisible ? "animate-fade-in" : "opacity-0",
    "fade-in-up": isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-4",
    "fade-in-down": isVisible ? "animate-fade-in-down" : "opacity-0 -translate-y-4",
  }

  return (
    <div
      ref={ref}
      className={`${animationClasses[animation]} transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </div>
  )
}

const features = [
  {
    icon: BookOpen,
    title: "Beautiful Reader",
    description: "Single or double-page layouts with gesture controls",
  },
  {
    icon: Calendar,
    title: "Weekly Releases",
    description: "Browse new issues, build your pull list",
  },
  {
    icon: Library,
    title: "Your Collection",
    description: "Filter, organize, pick up where you left off",
  },
]

const readerFeatures = [
  {
    icon: Hand,
    title: "Gesture Controls",
    description: "Swipe to turn pages, pinch to zoom, double-tap to fit. Natural controls that feel right.",
  },
  {
    icon: Layers,
    title: "Reading Modes",
    description: "Single page, double page spread, or continuous scroll. Switch layouts mid-read.",
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Progress",
    description: "Mark pages, add notes, and always pick up exactly where you left off.",
  },
  {
    icon: Search,
    title: "Quick Navigation",
    description: "Jump to any page instantly. Thumbnail previews make finding your spot easy.",
  },
]

const libraryFeatures = [
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Issues automatically group by series. Filter by reading status, publisher, or create custom collections.",
  },
  {
    icon: Bell,
    title: "Pull List",
    description: "Follow series you love. Get notified when new issues drop. Never miss a release.",
  },
  {
    icon: Download,
    title: "Multiple Sources",
    description: "Drag files from your device, paste URLs, or import from cloud storage. Your comics, your way.",
  },
]

const formats = [
  { name: "CBZ", description: "Comic Book ZIP archives" },
  { name: "CBR", description: "Comic Book RAR archives" },
  { name: "PDF", description: "Portable Document Format" },
  { name: "EPUB", description: "Digital publications" },
]

const values = [
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data stays on your device. No accounts, no tracking, no analytics.",
  },
  {
    icon: Code,
    title: "Open Source",
    description:
      "Every line of code is public. Audit it, fork it, contribute to it.",
  },
  {
    icon: Zap,
    title: "Performance",
    description:
      "Fast load times, smooth scrolling, instant navigation.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Features shaped by readers. Bug reports and pull requests welcome.",
  },
]

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
    <div className="min-h-screen bg-background flex flex-col">
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
          <Button onClick={handleGetStarted} size="sm" className="gap-1.5">
            Open App
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 md:px-8 mx-auto w-full max-w-screen-xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 py-16 sm:py-24 lg:py-32">
            {/* Copy */}
            <ScrollAnimatedSection className="flex flex-col justify-center" animation="fade-in-up">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Your comics.
                <br />
                Everywhere.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8">
                The best free comic reader. Period.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <Button onClick={handleGetStarted} size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground font-mono">
                  CBZ · CBR · PDF · EPUB
                </span>
              </div>
            </ScrollAnimatedSection>

            {/* Geometric Visual */}
            <ScrollAnimatedSection className="hidden lg:flex items-center justify-center" animation="fade-in">
              <div className="relative w-80 h-96">
                {/* Abstract comic panel grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-2 transform rotate-3">
                  <div className="col-span-2 row-span-2 border border-border bg-secondary/30" />
                  <div className="border border-border bg-secondary/20" />
                  <div className="row-span-2 border border-border bg-secondary/40" />
                  <div className="col-span-2 border border-border bg-secondary/20" />
                  <div className="border border-border bg-secondary/30" />
                  <div className="col-span-2 border border-border bg-secondary/50" />
                </div>
                {/* Offset layer for depth */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-2 transform -rotate-2 translate-x-4 translate-y-4 opacity-40">
                  <div className="col-span-2 row-span-2 border border-border" />
                  <div className="border border-border" />
                  <div className="row-span-2 border border-border" />
                  <div className="col-span-2 border border-border" />
                  <div className="border border-border" />
                  <div className="col-span-2 border border-border" />
                </div>
              </div>
            </ScrollAnimatedSection>
          </div>
        </section>

        {/* Quick Features */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <div className="grid sm:grid-cols-3 gap-12 lg:gap-16">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  <feature.icon className="w-5 h-5 mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Reader Deep Dive */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24" animation="fade-in-up">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                A reader built for comics
              </h2>
              <p className="text-muted-foreground">
                Not a PDF viewer with comic support. A purpose-built reading experience designed around how you actually read comics.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
              {readerFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex gap-4 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  <div className="flex-shrink-0 w-10 h-10 border border-border bg-background flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Library Deep Dive */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24" animation="fade-in-up">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Your collection, organized
              </h2>
              <p className="text-muted-foreground">
                Whether you have 10 comics or 10,000, keep everything in one place. Filter, sort, and find what you want to read next.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 lg:gap-12">
              {libraryFeatures.map((feature, index) => (
                <div
                  key={feature.title}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  <div className="w-10 h-10 border border-border bg-secondary/50 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Weekly Releases */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24" animation="fade-in-up">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Never miss an issue
                </h2>
                <p className="text-muted-foreground mb-6">
                  Browse this week's releases across all major publishers. See what's dropping, discover new series, and build your reading queue.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Weekly release calendar from major publishers</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Follow series to track new issues</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span>Discover trending and new series</span>
                  </li>
                </ul>
                <Link href="/releases">
                  <Button variant="outline" className="gap-2">
                    Browse Releases
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="hidden lg:block">
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] border border-border bg-background opacity-0 animate-fade-in"
                      style={{
                        opacity: 1 - i * 0.12,
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: "forwards",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Formats */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <h2 className="text-lg font-medium mb-8">Supported formats</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formats.map((format, index) => (
                <div
                  key={format.name}
                  className="p-4 border border-border opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: "forwards" }}
                >
                  <div className="font-mono text-lg font-medium mb-1">{format.name}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Works Everywhere */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24" animation="fade-in-up">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Works everywhere
                </h2>
                <p className="text-muted-foreground mb-6">
                  A progressive web app that runs in any browser. Install it on your phone, tablet, or desktop. Read offline. No app store required.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Desktop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tablet className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Tablet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Mobile</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Offline</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center gap-4">
                <div className="w-16 h-24 border border-border bg-background opacity-0 animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "forwards" }} />
                <div className="w-24 h-32 border border-border bg-background opacity-0 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "forwards" }} />
                <div className="w-32 h-20 border border-border bg-background opacity-0 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "forwards" }} />
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Values */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <h2 className="text-lg font-medium mb-8">Built different</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  <value.icon className="w-5 h-5 mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Tech */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm text-muted-foreground">Built with</span>
              <div className="flex flex-wrap gap-2">
                {["Next.js", "React", "TypeScript", "IndexedDB", "PWA"].map(
                  (tech, index) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-sm font-mono border border-border rounded opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 75}ms`, animationFillMode: "forwards" }}
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 text-center" animation="fade-in-up">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Start reading
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              No sign-up. No credit card. Just open the app and drop in your first comic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGetStarted} size="lg" className="gap-2">
                Open Library
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="w-4 h-4" />
                  View Source
                </Button>
              </a>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Community CTA */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h2 className="text-xl font-medium mb-2">Join the community</h2>
                <p className="text-sm text-muted-foreground">
                  Star us on GitHub, report bugs, or contribute code.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://github.com/TimMikeladze/floppy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={() => setSupportOpen(true)}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Support
                </Button>
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Built by */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-12 sm:py-16" animation="fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Built by</span>
                <a
                  href="https://linesofcode.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline underline-offset-4"
                >
                  linesofcode.dev
                </a>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/TimMikeladze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://twitter.com/linesofcode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </a>
                <a
                  href="https://bsky.app/profile/linesofcode.bsky.social"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 568 501" fill="currentColor">
                    <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z"/>
                  </svg>
                  <span>Bluesky</span>
                </a>
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
              <a
                href="https://github.com/TimMikeladze/floppy/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Releases
              </a>
            </div>
          </div>
        </div>
      </footer>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
